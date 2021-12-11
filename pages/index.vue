<template>
  <v-app>
    <v-app-bar flat color="white" class="py-3" app>
      <a href="https://retreeb.io" target="_blank">
        <img
            v-if="$vuetify.breakpoint.mdAndUp"
            class="ml-5"
            alt="logo retreeb"
            height="42"
            src="/logo-retreeb.svg"
        >
      </a>
    </v-app-bar>
    <v-main>
      <v-container class="main-container" fill-height>
        <v-row justify="center">
          <v-col align="center">

            <div class="alert-container">
              <v-alert :value="errors[index].value" dismissible type="error" v-for="(error, index) in errors" :key="index">
                {{ error.message }}
              </v-alert>
            </div>

            <v-card class="main-card">

              <v-card-title align="center">
                <h1>Retreeb Airdrop</h1>
                <v-spacer></v-spacer>
                <span>
                <span>Balance: {{contractBalance}}</span>
                <span class="token">0</span>
                </span>
              </v-card-title>

              <v-card-text>
                <span>Please enter treeb amount you want to send (for each address)</span>
                <v-text-field v-model="amount">
                  <span slot="append" class="token">0</span>
                </v-text-field>

                <v-container fluid>
                  <v-switch
                      class="switch"
                      v-model="manualEntry"
                      label="Manual entry"
                  ></v-switch>
                </v-container>

                <v-container v-if="manualEntry">
                  <span>Please enter addresses</span>
                  <v-text-field v-model="newAddress" @keydown.enter="manualAddressEntry" />
                </v-container>

                <v-container v-else>
                  <span>Please enter your csv file</span>
                  <v-file-input
                      show-size
                      truncate-length="15"
                  ></v-file-input>
                </v-container>

                <v-expansion-panels class="py-3" v-if="addresses.length">
                  <v-expansion-panel>
                    <v-expansion-panel-header>
                      Selected addresses
                    </v-expansion-panel-header>
                    <v-expansion-panel-content v-for="address in addresses" :key="address">
                      {{ address.slice(0, 10) + '...' + address.slice(32, 42) }}
                      <v-icon @click="removeAddress(address)">
                        mdi-close
                      </v-icon>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-text>

              <v-card-actions>
                <v-btn class="btn-primary" @click="submit">Send</v-btn>
              </v-card-actions>
              <v-card-actions>
                <v-spacer></v-spacer>
                <a @click="withdrawResidualToken">Withdraw residual TREEB</a>
              </v-card-actions>

            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

  </v-app>
</template>

<script>

import { ethers } from 'ethers';
import Airdropper from '../artifacts/contracts/airdropper/airdropper.sol/airdropper.json';
import Treeb from '../artifacts/contracts/token/token.sol/token.json';
import { isAddress } from '~/utils/validation';

export default {

  data() {
    return {
      amount: 0,
      myAddress: null,
      signer: null,
      newAddress: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      addresses: ['0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc'],
      treebAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      treebABI: Treeb.abi,
      contractBalance: '',
      airdropperAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      airdropperABI: Airdropper.abi,
      manualEntry: true,
      errors: [],
    };
  },

  async mounted() {
    await this.connectWeb3();

    await this.changeNetwork();

    await this.getSmartContractBalance();

    // Force page refreshes on network changes
    // The "any" network will allow spontaneous network changes
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
    provider.on('network', (newNetwork, oldNetwork) => {
      if (oldNetwork) {
        window.location.reload();
      }
    });
  },

  methods: {
    // request access to the user's account. This works regardless of the wallet you're using.
    async connectWeb3() {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        const provider = new ethers.providers.Web3Provider(window.ethereum);

        this.signer = provider.getSigner();

        this.myAddress = await this.signer.getAddress();
      }
    },

    async submit() {
      try {
        this.loading = true;

        if (window.ethereum) {
          await this.connectWeb3();

          await this.approve();

          await this.airdrop(this.addresses);
        }
      } catch (e) {
        this.addNewError(e.data?.message || e.message);
      } finally {
        this.loading = false;
      }
    },

    async approve() {
      try {
      // load contract
        const treebContract = new ethers.Contract(this.treebAddress, this.treebABI, this.signer);

        const totalAmountToSend = this.amount * this.addresses.length;

        // check allowance
        const allowance = await treebContract.allowance(this.myAddress, this.airdropperAddress) > totalAmountToSend;

        // if user address still not allow
        if (!allowance) {
        // approve the address
          const approveTransaction = await treebContract.approve(this.airdropperAddress, ethers.constants.MaxUint256);
          await approveTransaction.wait();
        }
      } catch (e) {
        this.addNewError(e.data?.message || e.message);
      } finally {
        this.loading = false;
      }
    },

    async airdrop(addresses) {
      this.loading = true;
      if (!this.amount) {
        this.addNewError('Amount cannot be less than 0 TREEB');
        return;
      }
      if (!this.addresses.length) {
        this.addNewError('Please enter at least one address');
        return;
      }

      try {
        const contract = new ethers.Contract(this.airdropperAddress, this.airdropperABI, this.signer);
        const airdropTransaction = await contract.transferToUsers(addresses, ethers.utils.parseEther(this.amount));
        await airdropTransaction.wait();

        // refresh balance
        await this.getSmartContractBalance();
      } catch (e) {
        this.addNewError(e.data?.message || e.message);
      } finally {
        this.loading = false;
      }
    },

    async withdrawResidualToken() {
      try {
        const contract = new ethers.Contract(this.airdropperAddress, this.airdropperABI, this.signer);
        const airdropTransaction = await contract.withdrawResidualToken();
        await airdropTransaction.wait();
      } catch (e) {
        this.addNewError(e.data?.message || e.message);
      } finally {
        // refresh blance
        await this.getSmartContractBalance();
        this.loading = false;
      }
    },

    async getSmartContractBalance() {
      this.loading = true;
      try {
        await this.connectWeb3();
        const treebContract = new ethers.Contract(this.treebAddress, this.treebABI, this.signer);
        const balance = await treebContract.balanceOf(this.airdropperAddress);
        this.contractBalance = ethers.utils.formatEther(balance.toString());
      } catch (e) {
        this.addNewError(e.data?.message || e.message);
      } finally {
        this.loading = false;
      }
    },

    manualAddressEntry() {
      const address = this.newAddress;

      if (isAddress(address)) {
        this.addresses.push(address);
        this.newAddress = '';
      } else {
        const shortAddress = `${address.slice(0, 10)}...${address.slice(32, 42)}`;
        this.addNewError(`${shortAddress} is not a valid address`);
      }
    },

    removeAddress(addressToRemove) {
      this.addresses = this.addresses.filter((el) => el !== addressToRemove);
    },

    changeNetwork() {

    },

    addNewError(message) {
      const error = { message, value: true };
      const errorId = this.errors.length;
      this.errors.push(error);
      setTimeout(() => {
        this.errors[errorId].value = false;
      }, 3500);
    },
  },
};
</script>

<style>
.main-container{
  justify-content: center;
}

.alert-container{
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10
}
</style>
