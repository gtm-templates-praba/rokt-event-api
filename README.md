# Unofficial Rokt Event API Tag for Google Tag Manager Server Container

An unofficial Server-side Google Tag Manager template for sending conversion events to Rokt Ads via their Event API.

## Prerequisites

- Rokt Account ID
- Rokt Public Key (format: `rpub-xxxx-xxxx`)
- Rokt Secret Key (format: `rsec-xxxx-xxxx`)

## API Endpoint

- URL: `https://api.rokt.com/v2/events`
- Method: `POST`
- Content-Type: `application/json`
- Rokt-Version: `2020-05-21`

## Configuration

### Required Fields

| Field               | Description                  | Format                                 |
| ------------------- | ---------------------------- | -------------------------------------- |
| **Rokt Account ID** | Your Rokt Account identifier | String (max 64 chars)                  |
| **Rokt Public Key** | Your Rokt Public API key     | `rpub-xxxx-xxxx`                       |
| **Rokt Secret Key** | Your Rokt Secret API key     | `rsec-xxxx-xxxx`                       |
| **Event Type**      | Type of conversion event     | `sign_up`, `purchase`, `booking`, etc. |

### Optional Fields

| Field                | Description                           | Example                                       |
| -------------------- | ------------------------------------- | --------------------------------------------- |
| **Rokt Tracking ID** | Rokt-generated conversion tracking ID | From `passbackconversiontrackingid` parameter |
| **Object Data**      | Additional event parameters           | `email`, `amount`, `currency`                 |
| **Metadata**         | Non-business critical information     | `source`, `campaign`                          |

### Object Data Fields

Common object data fields supported by Rokt Event API:

- `email` - Customer email address
- `amount` - Transaction amount
- `currency` - Currency code (e.g., USD, EUR)
- `firstname` - Customer first name
- `lastname` - Customer last name
- `phone` - Customer phone number
- `country` - Country code
- `postcode` - Postal/ZIP code

For the complete list of supported fields, refer to the [Rokt Event API Documentation](https://docs.rokt.com/developers/api-reference/event-api).

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](license) file for details.

## Author

Developed and maintained by [Praba Ponnambalam](https://prabapro.me/)

<hr>

**Note**: This is an unofficial template and is not affiliated with or endorsed by Rokt. Use at your own discretion and ensure compliance with your organization's data privacy policies.
