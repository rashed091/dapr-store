// ----------------------------------------------------------------------------
// Copyright (c) Ben Coleman, 2020
// Licensed under the MIT License.
//
// Dapr Store frontend - API helper to call the various backend microservices
// ----------------------------------------------------------------------------

import axios from 'axios'
import auth from '../services/auth'

const API_SCOPE = 'store-api'

export default {
  data() {
    return {
      accessToken: null
    }
  },

  methods: {
    //
    // ===== Users =====
    //
    apiUserRegister: function(user) {
      return this._apiRawCall('v1.0/invoke/users/method/register', 'POST', user)
    },

    apiUserGet: function(username) {
      return this._apiRawCall(`v1.0/invoke/users/method/get/${username}`)
    },

    apiUserCheckReg: function(username) {
      return this._apiRawCall(`v1.0/invoke/users/method/isregistered/${username}`)
    },

    //
    // ===== Products =====
    //
    apiProductCatalog: function() {
      return this._apiRawCall('v1.0/invoke/products/method/catalog')
    },

    apiProductOffers: function() {
      return this._apiRawCall('v1.0/invoke/products/method/offers')
    },

    apiProductGet: function(productId) {
      return this._apiRawCall(`v1.0/invoke/products/method/get/${productId}`)
    },

    apiProductSearch: function(query) {
      return this._apiRawCall(`v1.0/invoke/products/method/search/${query}`)
    },

    //
    // ===== Cart =====
    //
    apiCartProductSet: function(username, productId, count) {
      return this._apiRawCall(`v1.0/invoke/cart/method/setProduct/${username}/${productId}/${count}`, 'PUT')
    },

    apiCartGet: function(username) {
      return this._apiRawCall(`v1.0/invoke/cart/method/get/${username}`, 'GET')
    },

    apiCartSubmit: function(username) {
      return this._apiRawCall('v1.0/invoke/cart/method/submit', 'POST', `"${username}"`)
    },

    apiCartClear: function(username) {
      return this._apiRawCall(`v1.0/invoke/cart/method/clear/${username}`, 'PUT', `"${username}"`)
    },

    apiCartAddAmount: async function(username, productId, amount) {
      let count = 0
      let cartResp = await this.apiCartGet(username)
      if (cartResp.data) {
        let cart = cartResp.data
        let productCount = cart.products[productId]
        if (productCount) {
          count = productCount + amount
        } else {
          count = amount
        }
        if (count < 0) { count = 0 }
      }
      return this.apiCartProductSet(username, productId, count)
    },

    //
    // ===== Orders =====
    //
    apiOrderGet: function(orderId) {
      return this._apiRawCall(`v1.0/invoke/orders/method/get/${orderId}`)
    },

    apiOrdersForUser: function(username) {
      return this._apiRawCall(`v1.0/invoke/orders/method/getForUser/${username}`)
    },

    //
    // ===== Base Axios wrapper =====
    //
    _apiRawCall: async function(apiPath, method = 'get', data = null) {
      let headers = {}
      let apiUrl = `${(this.$config.API_ENDPOINT || '/')}${apiPath}`
      console.log(`### API CALL ${method} ${apiUrl}`)

      // Only get a token if logged in & using real auth (i.e AUTH_CLIENT_ID set)
      if (auth.user() && this.$config.AUTH_CLIENT_ID) {
        const scopes = [ `api://${this.$config.AUTH_CLIENT_ID}/${API_SCOPE}` ]

        // Try to get an access token with our API scope
        if (!this.accessToken) {
          this.accessToken = await auth.acquireToken(scopes)
        }

        // Send token as per the OAuth 2.0 bearer token scheme
        if (this.accessToken) {
          headers = {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      }

      return axios({
        method: method,
        url: apiUrl,
        data: data,
        headers: headers
      })
    },

    //
    // Helper to decode error messages
    //
    apiDecodeError(err) {
      if (err.response && err.response.data && err.response.headers['content-type'].includes('json')) {
        return err.response.data
      }
      if (err.response && err.request) {
        return `HTTP ${err.response.status}: API call failed: ${err.request.responseURL}`
      }
      return err.toString()
    }
  }
}