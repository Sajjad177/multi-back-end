import { companyName } from '../lib/globalType';

interface ISellerApplicationApprovedTemplate {
  firstName: string;
  businessName: string;
  setupUrl: string;
}
const sellerApplicationApprovedTemplate = ({
  firstName,
  businessName,
  setupUrl,
}: ISellerApplicationApprovedTemplate) => `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Your seller application has been approved</title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background: #f5f4f1;
    font-family: Arial, Helvetica, sans-serif;
  "
>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    width: 100%;
    background: #f5f4f1;
    padding: 50px 16px;
  "
>
<tr>
<td align="center">

  <!-- Email Card -->
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      max-width: 540px;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
    "
  >

    <!-- Brand -->
    <tr>
      <td
        align="center"
        style="
          padding: 46px 32px 34px;
        "
      >
        <div
          style="
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 38px;
            line-height: 1;
            font-weight: 400;
            letter-spacing: -1.5px;
            color: #111111;
          "
        >
          ${companyName}
        </div>
      </td>
    </tr>

    <!-- Divider -->
    <tr>
      <td>
        <div
          style="
            height: 1px;
            background: #eeeeee;
            margin: 0 40px;
          "
        ></div>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td
        align="center"
        style="
          padding: 52px 40px 48px;
        "
      >

        <!-- Label -->
        <div
          style="
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            color: #2C5745;
            margin-bottom: 22px;
          "
        >
          SELLER APPLICATION
        </div>

        <!-- Heading -->
        <h1
          style="
            margin: 0;
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 34px;
            line-height: 1.25;
            font-weight: 400;
            letter-spacing: -0.8px;
            color: #111111;
          "
        >
          You're approved.
        </h1>

        <!-- Description -->
        <p
          style="
            max-width: 390px;
            margin: 20px auto 0;
            font-size: 14px;
            line-height: 1.7;
            color: #777777;
          "
        >
          Hi ${firstName}, your application for
          <strong style="color: #333333;">
            ${businessName}
          </strong>
          has been approved.
        </p>

        <!-- Setup Box -->
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            margin-top: 32px;
            background: #f7f6f3;
            border: 1px solid #ebe9e4;
            border-radius: 16px;
          "
        >
          <tr>
            <td
              align="center"
              style="
                padding: 24px;
              "
            >

              <div
                style="
                  font-size: 13px;
                  line-height: 1.6;
                  color: #555555;
                "
              >
                Complete your account setup to access
                your seller dashboard.
              </div>

            </td>
          </tr>
        </table>

        <!-- Button -->
        <table
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            margin-top: 30px;
          "
        >
          <tr>
            <td
              align="center"
              style="
                border-radius: 12px;
                background: #2C5745;
              "
            >
              <a
                href="${setupUrl}"
                target="_blank"
                style="
                  display: inline-block;
                  padding: 15px 30px;
                  font-size: 13px;
                  font-weight: 600;
                  letter-spacing: 0.3px;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 12px;
                "
              >
                Complete Account Setup
              </a>
            </td>
          </tr>
        </table>

        <!-- Expiration -->
        <p
          style="
            margin: 20px 0 0;
            font-size: 12px;
            color: #999999;
          "
        >
          This setup link expires in 30 minutes.
        </p>

      </td>
    </tr>

    <!-- Accent -->
    <tr>
      <td
        style="
          height: 5px;
          background: #2C5745;
        "
      ></td>
    </tr>

  </table>

  <!-- Copyright -->
  <div
    style="
      margin-top: 22px;
      font-size: 10px;
      color: #aaa9a5;
      text-align: center;
    "
  >
    © ${new Date().getFullYear()} ${companyName}
  </div>

</td>
</tr>
</table>

</body>
</html>
`;

export default sellerApplicationApprovedTemplate;
