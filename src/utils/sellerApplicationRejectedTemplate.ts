import { companyName } from '../lib/globalType';

interface ISellerApplicationRejectedTemplate {
  firstName: string;
  businessName: string;
  rejectionReason: string;
}

const sellerApplicationRejectedTemplate = ({
  firstName,
  businessName,
  rejectionReason,
}: ISellerApplicationRejectedTemplate) => `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Seller application update</title>
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

        <div
          style="
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            color: #9a8050;
            margin-bottom: 22px;
          "
        >
          APPLICATION UPDATE
        </div>

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
          Application update
        </h1>

        <p
          style="
            max-width: 390px;
            margin: 20px auto 0;
            font-size: 14px;
            line-height: 1.7;
            color: #777777;
          "
        >
          Hi ${firstName}, we've reviewed your seller
          application for
          <strong style="color: #333333;">
            ${businessName}
          </strong>.
        </p>

        <!-- Reason -->
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
              align="left"
              style="
                padding: 24px;
              "
            >

              <div
                style="
                  font-size: 10px;
                  font-weight: 700;
                  letter-spacing: 1.5px;
                  text-transform: uppercase;
                  color: #999999;
                  margin-bottom: 10px;
                "
              >
                REVIEW NOTE
              </div>

              <div
                style="
                  font-size: 14px;
                  line-height: 1.7;
                  color: #555555;
                "
              >
                ${rejectionReason}
              </div>

            </td>
          </tr>
        </table>

        <p
          style="
            max-width: 390px;
            margin: 24px auto 0;
            font-size: 12px;
            line-height: 1.6;
            color: #999999;
          "
        >
          You may review your information and submit
          a new application in the future.
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

export default sellerApplicationRejectedTemplate;
