class UserStatusChannel < ApplicationCable::Channel
  USER_STATUS_ACTIVE = "active"
  USER_STATUS_AWAY = "away"
  USER_STATUS_OFFLINE = "offline"

  USER_STATUES_CACHE_KEY = "user_statuses"

  on_subscribe :user_status_active, unless: :subscription_rejected?
  on_unsubscribe :user_status_offline,  unless: :subscription_rejected?


  def subscribed
    stream_from "user_status"
  end

  def user_status_active
    broadcast_user_status(params[:userId], USER_STATUS_ACTIVE)
  end

  def user_status_away
    broadcast_user_status(params[:userId], USER_STATUS_AWAY)
  end

  def user_status_offline
    broadcast_user_status(params[:userId], USER_STATUS_OFFLINE)
  end

  def get_users_statuses
    ActionCable.server.broadcast("user_status", get_user_status_hash)
  end

  private
    def broadcast_user_status(user_id, status)
      return if user_id.nil?

      update_user_status_hash(user_id, status)
      ActionCable.server.broadcast("user_status", get_user_status_hash)
    end

    def get_user_status_hash
      Rails.cache.read(USER_STATUES_CACHE_KEY)
    end

    def update_user_status_hash(user_id, status)
      data = get_user_status_hash

      if data.nil?
        data = {}
      end

      data[user_id] = status

      Rails.cache.write(USER_STATUES_CACHE_KEY, data)
    end
end
