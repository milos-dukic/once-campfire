import { Controller } from "@hotwired/stimulus"
import { cable } from "@hotwired/turbo-rails"
import { pageIsTurboPreview } from "helpers/turbo_helpers"

const OFFLINE_AFTER_DISCONNECTED_TIMEOUT = 5_000
const REFRESH_AFTER_HIDDEN_TIMEOUT = 60_000

const STATUS_ACTIVE = "active"
const STATUS_AWAY = "away"
const STATUS_OFFLINE = "offline"

export default class extends Controller {
  static targets = [ "status", "main" ]
  static values = { userId: Number }

  #offlineTimer = null
  #hiddenAt = null

  async connect() {
    if (!pageIsTurboPreview()) {
      this.#channelDisconnected()

      this.channel = await cable.subscribeTo({ channel: "UserStatusChannel", userId: this.userIdValue }, {
        connected: this.#channelConnected.bind(this),
        disconnected: this.#channelDisconnected.bind(this),
      })
      this.#setStatus(STATUS_ACTIVE, this.userIdValue)
    }
  }

  disconnect() {
    this.channel?.unsubscribe()
  }

  visibilityChanged(event) {
    let userId = event.params.userId
    if (document.visibilityState === "visible") {
      if (this.#hiddenForTooLong()) {
        this.dispatch("visible")
      }
      this.#setStatus(STATUS_ACTIVE, userId)
      this.#hiddenAt = null
    } else {
      this.#hiddenAt = Date.now()
      this.#setStatus(STATUS_AWAY, userId)
    }
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

  #hiddenForTooLong() {
    return this.#hiddenAt && Date.now() - this.#hiddenAt > REFRESH_AFTER_HIDDEN_TIMEOUT
  }

  // user status logic
  #checkIfPresenceStatusIsApplicapble(userId) {
    return this.#isCurrentUser(userId) && this.#checkIfTargetIsOnStatusOrMain();
  }

  #isCurrentUser(userId) {
    if (userId === null) return false
    return userId === Current.user.id
  }

  #checkIfTargetIsOnStatusOrMain() {
    return this.statusTargets.length > 0 || this.mainTargets.length > 0
  }

  #setStatus(status, userId) {
    if (!this.#checkIfPresenceStatusIsApplicapble(userId)) return;

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
    if (!this.#checkIfPresenceStatusIsApplicapble(userId)) return;

    this.channel.send({ action: "user_status_active"})
  }

  #setStatusAway(userId) {
    if (!this.#checkIfPresenceStatusIsApplicapble(userId)) return;

    this.channel.send({ action: "user_status_away"})
  }

  #setStatusOffline(userId) {
    if (!this.#checkIfPresenceStatusIsApplicapble(userId)) return;

    this.channel.send({ action: "user_status_offline"})
  }
}