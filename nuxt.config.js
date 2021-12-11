import colors from 'vuetify/es5/util/colors'


export default {
    // Target: https://go.nuxtjs.dev/config-target
    target: 'static',

    env:{
        TESTFTM_URL: process.env.TESTFTM_URL
    },

    // Global page headers: https://go.nuxtjs.dev/config-head
    head: {
        titleTemplate: '%s - Retreeb',
        title: 'Airdrop',
        htmlAttrs: {
            lang: 'en'
        },
        meta: [
            { charset: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=0' },
            { hid: 'description', name: 'description', content: '' },
            { name: 'format-detection', content: 'telephone=no' }
        ],
        link: [
            { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
            { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
            { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&amp;display=swap' }
        ]
    },

    css: ['@/assets/main.css'],

    buildModules: ['@nuxtjs/vuetify'],

    // Auto import components: https://go.nuxtjs.dev/config-components
    components: true,


    // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
    vuetify: {
        theme: {
            dark: false,
            themes: {
                light: {
                    primary: '#343ede',
                    empty: '#ACACAC',
                    accent: colors.grey.darken3,
                    secondary: colors.amber.darken3,
                    info: colors.teal.lighten1,
                    warning: colors.amber.base,
                    error: colors.deepOrange.accent4,
                    success: colors.green.accent3
                }
            }
        }
    }
}
