require "zlib"

module Users::AvatarsHelper
  AVATAR_COLORS = %w[
    #AF2E1B #CC6324 #3B4B59 #BFA07A #ED8008 #ED3F1C #BF1B1B #736B1E #D07B53
    #736356 #AD1D1D #BF7C2A #C09C6F #698F9C #7C956B #5D618F #3B3633 #67695E
  ]

  def avatar_background_color(user)
    AVATAR_COLORS[Zlib.crc32(user.to_param) % AVATAR_COLORS.size]
  end

  def avatar_tag(user, **options)
    if options[:hide_status]
      link_to user_path(user), title: user.title, class: "btn avatar user-status-container", data: { turbo_frame: "_top" } do
        image_tag(fresh_user_avatar_path(user), aria: { hidden: "true" }, size: 48, **options)
      end
    else
      link_to user_path(user), title: user.title, class: "btn avatar user-status-container", data: { turbo_frame: "_top" } do
        image_tag(fresh_user_avatar_path(user), aria: { hidden: "true" }, size: 48, **options) +
        user_status_tag(user, options[:large_avatar])
      end
    end
  end

  def user_status_tag(user, large_avatar = false)
    return content_tag(:div, "", class: "user-status user-status-bot-always-active") if is_user_bot?(user)

    content_tag(:div, "", class: class_names("user-status", 'user-status-large': large_avatar), data: {
      controller: "user-status-avatar",
      user_status_avatar_user_id_value: user.id,
      user_status_avatar_target: "avatar"
    })
  end
end
