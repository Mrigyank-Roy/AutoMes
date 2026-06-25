ALL_REMINDER_NUMBERS = (1..5).to_a

outboxes = MailOutbox.where(corporate_id: 1836).where("mail_type LIKE ?", "novo_reminder_mail_%")
grouped = outboxes.group_by(&:user_id)

results = {}

grouped.each do |user_id, records|
  success = []
  failed  = []

  records.each do |record|
    reminder_number = record.mail_type.split("_").last.to_i
    next if reminder_number.zero?

    if record.status == "sent"
      success << reminder_number
    else
      failed << reminder_number
    end
  end

  success = success.uniq.sort
  failed = failed.uniq.sort

  results[user_id] = {
    success: success,
    failed: failed,
  }
end

results.each do |user_id, data|
  puts "user_id: #{user_id} => success: #{data[:success]}, failed: #{data[:failed]}"
end