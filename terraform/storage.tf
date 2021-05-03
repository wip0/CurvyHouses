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

    tags = {
        Name = var.stack_tag_name
    }
}