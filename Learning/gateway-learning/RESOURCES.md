# Resources

Trusted sources for the enterprise-gateway track. Prefer these over parametric knowledge.

## AWS API Gateway (the reference design)
- **[Usage plans and API keys for REST APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-usage-plans.html)**
  — *primary source for Lessons 1–2.* Defines API keys, usage plans (throttle = rate +
  burst token bucket; quota = requests per day/week/month), and the key → plan → stage
  relationship. Contains the crucial best-practice: **API keys are for identification /
  metering, NOT authentication** — use a Lambda authorizer / Cognito / IAM for real auth.
  Header AWS expects: `x-api-key`.
- **[Set up API keys](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-setup-api-keys.html)**
  — key value is a 20–128 char alphanumeric string; keys must be unique.
- **[Throttle API requests for better throughput](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html)**
  — AWS's token-bucket throttling model (rate + burst), account/stage/method/usage-plan
  levels, and the 429 `Too Many Requests` response. Maps directly to your Redis token bucket.
- **[Use API Gateway Lambda authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)**
  — for the JWT phase: the "authorizer returns a policy / identity" model.

## Express / Node (implementation)
- **[Express — Writing middleware](https://expressjs.com/en/guide/writing-middleware.html)** — official middleware guide.
- **[MDN — HTTP 401 Unauthorized](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401)** and
  **[403 Forbidden](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403)** — the
  authoritative distinction: 401 = *not authenticated* (who are you?), 403 = *authenticated
  but not allowed* (I know you, you can't). 401 should carry a `WWW-Authenticate` header.
- **[MDN — 429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)** — with `Retry-After`.

## Communities (wisdom — optional)
- r/aws and the AWS re:Post forum — good for "is this how real gateways do X?" sanity checks.
- The Express GitHub Discussions for middleware-pattern questions.
