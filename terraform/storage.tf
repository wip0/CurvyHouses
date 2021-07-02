resource "aws_dynamodb_table" "curvyhouses_ddb" {
    name            = "curvyhouses"
    billing_mode    = "PAY_PER_REQUEST"
    hash_key        = "pk"
    range_key       = "sk"

    attribute {
        name = "pk"
        type = "S"
    }

    attribute {
        name = "sk"
        type = "S"
    }

    attribute {
        name = "isSubscribed"
        type = "S"
    }

  global_secondary_index {
    name               = "subscribe-index"
    hash_key           = "pk"
    range_key          = "isSubscribed"
    projection_type    = "INCLUDE"
    non_key_attributes = ["displayName"]
  }

    tags = {
        Name = var.stack_tag_name
    }
}

resource "aws_s3_bucket" "curvyhouses_s3bucket" {
  bucket = "curvyhouses"
  acl    = "private"
  tags = {
      Name = var.stack_tag_name
  }
}
