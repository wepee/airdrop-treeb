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
                    v-model="csvFile"
                    @change="csvAddressesEntry"
                    show-size
                    truncate-length="15"
                  ></v-file-input>
                </v-container>

                <v-expansion-panels class="py-3" v-if="addresses.length">
                  <v-expansion-panel>
                    <v-expansion-panel-header>
                      Selected addresses ({{addresses.length}})
                      <v-spacer></v-spacer>
                      <v-btn style="max-width: 32px" icon @click="reset">
                        <v-icon >
                          mdi-close
                        </v-icon>
                      </v-btn>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content v-for="address in addresses" :key="address">
                      {{ address }}
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

import { ethers } from 'ethers'
import { csvToArray, isAddress } from "~/utils";
import { NETWORKS, ERROR, TREEB, AIRDROPPER, AIRDROPPER_TEST, TREEB_TEST } from "~/constants";

const isDev = process.env.mode === 'development'

export default {

  data() {
    return {
      amount: "",
      myAddress: null,
      provider: null,
      signer: null,
      newAddress: '',
      addresses: [],
      treebContractInfo: isDev ? TREEB_TEST : TREEB,
      airdropContractInfo: isDev ? AIRDROPPER_TEST : AIRDROPPER,
      contractBalance: '',
      airdropperContract: null,
      treebContract: null,
      params: process.env.mode === 'development' ? NETWORKS.TestnetParams : NETWORKS.ftmParams,
      csvFile: null,
      manualEntry: true,
      errors: [],
    }
  },

  async mounted() {

    await this.connectWeb3()

    await this.getSmartContractBalance()

    // Force page refreshes on network changes
    // The "any" network will allow spontaneous network changes
    this.provider.on('network', (newNetwork, oldNetwork) => {
      if (oldNetwork) {
        window.location.reload()
      }
    })
  },

  methods: {
    // request access to the user's account. This works regardless of the wallet you're using.
    async connectWeb3() {
      try{

        if (window.ethereum) {

          await window.ethereum.request({ method: 'eth_requestAccounts' });

          this.provider = new ethers.providers.Web3Provider(window.ethereum)

          this.signer = this.provider.getSigner()

          this.myAddress = await this.signer.getAddress()

          if (await window.ethereum.request({ method: 'eth_chainId' }) !== this.params.chainId) {
            throw ERROR.WRONG_NETWORK
          }

          this.airdropperContract = new ethers.Contract(this.airdropContractInfo.address, this.airdropContractInfo.abi, this.signer)
          this.treebContract = new ethers.Contract(this.treebContractInfo.address, this.treebContractInfo.abi, this.signer)

        } else {
          throw ERROR.NO_METAMASK
        }

      } catch (e) {

        this.addNewError(e)

        if(e == ERROR.WRONG_NETWORK) {
          await this.changeChainId()
        } else if(e == ERROR.NO_METAMASK){
          this.addNewError(e)
        }
      }
    },

    async submit() {
      try {
        this.loading = true

        if (window.ethereum) {
          await this.connectWeb3()

          await this.approve()

          await this.airdrop(this.addresses)
        }
      } catch (e) {
        this.addNewError(e)
      } finally {
        this.loading = false
      }
    },

    async changeChainId () {
      try {
        if ((await window.ethereum.request({ method: 'eth_chainId' })).toLowerCase() !== this.params.chainId.toLowerCase()) {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: this.params.chainId }]
          })
        }
      } catch (switchError) {
        console.log(switchError);
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902 || switchError.code === -32603) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainName: this.params.chainName,
                chainId: this.params.chainId,
                rpcUrls: [this.params.rpcUrls],
                nativeCurrency: {
                  name: this.params.nativeCurrency.name,
                  symbol: this.params.nativeCurrency.symbol, // 2-6 characters long
                  decimals: 18
                }
              }]
            })
          } catch (addError) {
            console.log(addError)
          }
        }
      }
    },

    async approve() {
      try {

        const totalAmountToSend = this.amount * this.addresses.length

        // check allowance
        const allowance = await this.treebContract.allowance(this.myAddress, this.airdropContractInfo.address) > totalAmountToSend

        // if user address still not allow
        if (!allowance) {
        // approve the address
          const approveTransaction = await this.treebContract.approve(this.airdropContractInfo.address, ethers.constants.MaxUint256)
          await approveTransaction.wait()
        }
      } catch (e) {
        this.addNewError(e.data?.message || e.message)
      } finally {
        this.loading = false
      }
    },

    async airdrop(addresses) {
      this.loading = true
      if (!this.amount) {
        this.addNewError('Amount cannot be less than 0 TREEB')
        return
      }
      if (!this.addresses.length) {
        this.addNewError('Please enter at least one address')
        return
      }

      try {
        const airdropTransaction = await this.airdropperContract.transferToUsers(addresses, ethers.utils.parseEther(this.amount))
        await airdropTransaction.wait()
      } catch (e) {
        this.addNewError(e)
      } finally {
        // refresh balance
        await this.getSmartContractBalance()
        this.loading = false
      }
    },

    async withdrawResidualToken() {
      try {
        const airdropTransaction = await this.airdropperContract.withdrawResidualToken()
        await airdropTransaction.wait()
      } catch (e) {
        this.addNewError(e)
      } finally {
        // refresh blance
        await this.getSmartContractBalance()
        this.loading = false
      }
    },

    async getSmartContractBalance() {
      this.loading = true
      try {
        const balance = await this.treebContract.balanceOf(this.airdropContractInfo.address)
        this.contractBalance = ethers.utils.formatEther(balance.toString())
      } catch (e) {
        this.addNewError(e)
      } finally {
        this.loading = false
      }
    },

    manualAddressEntry() {
      const address = this.newAddress

      if (isAddress(address)) {
        this.addresses.push(address)
        this.newAddress = ''
      } else {
        const shortAddress = `${address.slice(0, 10)}...${address.slice(32, 42)}`
        this.addNewError(`${shortAddress} is not a valid address`)
      }
    },

    csvAddressesEntry(){
      const input = this.csvFile;
      if(!input){
        return
      }

      const reader = new FileReader();

      reader.onload = function (e) {
        const text = e.target.result;
        const data = csvToArray(text);
        console.log(data)
        this.addresses = [...new Set(data)];
      }.bind(this)

      reader.readAsText(input);

    },

    removeAddress(addressToRemove) {
      this.addresses = this.addresses.filter((el) => el !== addressToRemove)
    },

    addNewError(e) {
      const message = e?.data?.message || e.message || e
      const error = { message, value: true }
      const errorId = this.errors.length
      this.errors.push(error)
      setTimeout(() => {
        this.errors[errorId].value = false
      }, 3500)
    },
    reset(){
      this.addresses = []
      this.csvFile = null
    }
  },
}
</script>

<style>
.main-container{
  justify-content: center
}

.alert-container{
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}
</style>
