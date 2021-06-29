resource "aws_cloudwatch_event_rule" "daily_cron" {
  name        = "daily_cron_trigger"
  description = "For triggering snp500 function daily"
  schedule_expression = "cron(0 0 * * ? *)" # run at 00:00 (UTC) everyday
}

resource "aws_cloudwatch_event_target" "lambda_daily_run" {
  rule      = aws_cloudwatch_event_rule.daily_cron.name
  target_id = "TriggerLambda"
  arn       = aws_lambda_function.curvy_lambda_snp500_daily_run.arn
}
