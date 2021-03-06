resource "aws_route53_zone" "curvyhouses" {
  name = var.domain_name
}

resource "aws_route53_record" "curvyhouses_a_record" {
  zone_id = aws_route53_zone.curvyhouses.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.curvy_alb.dns_name
    zone_id                = aws_lb.curvy_alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "curvyhouses_aaaa_record" {
  zone_id = aws_route53_zone.curvyhouses.zone_id
  name    = "api.${var.domain_name}"
  type    = "AAAA"

  alias {
    name                   = aws_lb.curvy_alb.dns_name
    zone_id                = aws_lb.curvy_alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "cname1" {
  zone_id = aws_route53_zone.curvyhouses.zone_id
  name    = "_0f9997df9df2b859747f85f4b0187dfa"
  type    = "CNAME"
  ttl     = "300"
  records = ["_6907f425e1d1616c124a63e284225525.nfyddsqlcy.acm-validations.aws."]
}


resource "aws_route53_record" "cname2" {
  zone_id = aws_route53_zone.curvyhouses.zone_id
  name    = "_1275a1bec6dfbef231cc58af763de874"
  type    = "CNAME"
  ttl     = "300"
  records = ["_97d475a0985d0e432240c1d2e6171c41.nfyddsqlcy.acm-validations.aws."]
}


resource "aws_route53_record" "cname3" {
  zone_id = aws_route53_zone.curvyhouses.zone_id
  name    = "_9c9a679c7b139bb5f7d30e9d35a1efdf"
  type    = "CNAME"
  ttl     = "300"
  records = ["_c942bf0a6c01c0587b4fed751c9d34ef.nfyddsqlcy.acm-validations.aws."]
}
