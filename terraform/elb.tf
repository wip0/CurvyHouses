resource "aws_lb" "curvy_alb" {
  name               = "curvyhouses-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = [var.aws_lb_subnet_a, var.aws_lb_subnet_b]
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.curvy_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.curvy_alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.certificate_arn

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "This is curvyhouses service running on elb!"
      status_code  = "404"
    }
  }
}

resource "aws_lb_listener_rule" "static" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.curvyhouses.arn
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}

resource "aws_lb_target_group" "curvyhouses" {
  name        = "tf-example-lb-tg"
  target_type = "lambda"
}

resource "aws_lambda_permission" "curvyhouses_alb" {
  statement_id  = "AllowExecutionFromALB"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.curvy_lambda.function_name
  principal     = "elasticloadbalancing.amazonaws.com"
  # qualifier     = aws_lambda_alias.live.name
  source_arn = aws_lb_target_group.curvyhouses.arn
}

resource "aws_lb_target_group_attachment" "curvy" {
  target_group_arn = aws_lb_target_group.curvyhouses.arn
  target_id        = aws_lambda_function.curvy_lambda.arn
  depends_on       = [aws_lambda_permission.curvyhouses_alb]
}
