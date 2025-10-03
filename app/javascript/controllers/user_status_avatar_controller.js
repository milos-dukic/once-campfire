import { Controller } from "@hotwired/stimulus"
import { cable } from "@hotwired/turbo-rails"
import { pageIsTurboPreview } from "helpers/turbo_helpers"

const OFFLINE_AFTER_DISCONNECTED_TIMEOUT = 5_000

const STATUS_ACTIVE = "active"
const STATUS_AWAY = "away"
const STATUS_OFFLINE = "offline"

export default class extends Controller {
  static targets = [ "avatar" ]
  static values = { userId: Number }

  #offlineTimer = null

  async connect() {
    this.channel = await cable.subscribeTo({ channel: "UserStatusChannel" }, {
      connected: this.#channelConnected.bind(this),
      disconnected: this.#channelDisconnected.bind(this),
      received: this.#read.bind(this)
    })
    this.channel.send({ action: "get_users_statuses"})
  }

  disconnect() {
    this.channel?.unsubscribe()
  }

  online() {
    // Trigger reconnection attempt whenever the browser comes back
    // from being offline
    this.channel.consumer.connection.monitor.visibilityDidChange()
  }

  #channelConnected() {

    clearTimeout(this.#offlineTimer)
    this.dispatch("online", { target: window })
  }

  #channelDisconnected() {
    this.#offlineTimer = setTimeout(() => {
      this.dispatch("offline", { target: window })
    }, OFFLINE_AFTER_DISCONNECTED_TIMEOUT)
  }

  // user status logic

  #read(data){
    this.#updateUserStatuses(data)
  }

  #updateUserStatuses(data){
    Object.entries(data).forEach(([user_id, status]) => {
      this.#setStatus(status, user_id)
    });
  }

  #setStatus(status, userId) {
    if (this.userIdValue != userId) return

    switch(status) {
      case STATUS_ACTIVE:
        this.#setStautsActive(userId)
        break;
      case STATUS_AWAY:
        this.#setStatusAway(userId)
        break;
      case STATUS_OFFLINE:
        this.#setStatusOffline(userId)
        break;
      default:
        // nothing
    }
  }

  #setStautsActive(userId) {
    this.avatarTarget.style.background = "green";
  }

  #setStatusAway(userId) {
    this.avatarTarget.style.background = "orange";
  }

  #setStatusOffline(userId) {
    this.avatarTarget.style.background = "gray";
  }
}
