resource "aws_sqs_queue" "curvyhouses_notify_queue" {
  name                      = "curvyhouses-notify-queue"
  delay_seconds             = 1
  max_message_size          = 102400
  message_retention_seconds = 86400
  receive_wait_time_seconds = 10
  visibility_timeout_seconds = 180

#   redrive_policy = jsonencode({
#     deadLetterTargetArn = aws_sqs_queue.terraform_queue_deadletter.arn
#     maxReceiveCount     = 4
#   })

  tags = {
    Name = var.stack_tag_name
  }
}
