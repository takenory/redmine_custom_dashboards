class Dashboard < ActiveRecord::Base
  belongs_to :user
  
  validates :name, presence: true, length: { maximum: 100 }
  validates :user_id, presence: true
  
  scope :for_user, ->(user) { where(user: user) }
  scope :default_for_user, ->(user) { where(user: user, is_default: true) }
  
  before_save :ensure_single_default
  
  def set_as_default!
    transaction do
      self.class.where(user: user).update_all(is_default: false)
      update!(is_default: true)
    end
  end
  
  private
  
  
  def ensure_single_default
    if is_default? && user.present?
      # Remove default from all other dashboards for this user
      self.class.where(user: user).where.not(id: id || 0).update_all(is_default: false)
    end
  end
end