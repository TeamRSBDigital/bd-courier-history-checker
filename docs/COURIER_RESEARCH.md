# Courier integration research record

Research date: 2026-08-17.

This file records the external-access assumptions used by the implementation. It is deliberately conservative: absence of public customer-history documentation is treated as a blocker rather than permission to scrape a merchant dashboard.

## Steadfast

- Public website: https://steadfast.com.bd/
- Merchant API base used by the adapter: `https://portal.packzy.com/api/v1`
- The fraud-check contract (`GET /fraud_check/{phone}` using `Api-Key` and `Secret-Key`) was found in a publicly indexed copy of Steadfast API documentation, not verified through a logged-in merchant account in this environment.
- Status: implementation complete; real API verification blocked on authorized merchant credentials/current documentation.

## Pathao

- Official help article: https://help.pathao.com/integrate-pathao-panel-with-website/
- Pathao states that merchants can integrate through the Developer API option in the merchant panel.
- A public official customer delivery-history endpoint/response contract was not verified.
- Status: provider shell complete; history call blocked on merchant-approved documentation.

## RedX

- Official developer page: https://redx.com.bd/developer-api/
- RedX advertises secure merchant OpenAPI/Developer API access.
- A public customer delivery-history response contract was not verified by the available crawler output.
- Status: provider shell complete; history call blocked on merchant-approved documentation.

## CarryBee

- Official website: https://carrybee.com/
- Official merchant platform is linked from the site.
- A public customer delivery-history API contract was not verified.
- Status: provider shell complete; history call blocked on merchant-approved documentation.

## Prohibited alternatives

The project does not use unofficial credential-sharing examples, merchant-panel scraping, OTP bypass, reverse-engineered authentication, or third-party courier-history aggregators as a substitute for authorized provider access.
