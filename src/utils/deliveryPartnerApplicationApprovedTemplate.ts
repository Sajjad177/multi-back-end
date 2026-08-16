import { companyName } from '../lib/globalType';

interface IDeliveryPartnerApplicationApprovedTemplate {
  firstName: string;
  setupUrl: string;
}

const deliveryPartnerApplicationApprovedTemplate = ({
  firstName,
  setupUrl,
}: IDeliveryPartnerApplicationApprovedTemplate) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your delivery partner application has been approved</title>
</head>
<body style="margin: 0; padding: 0; background: #f5f4f1; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; background: #f5f4f1; padding: 50px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; background: #ffffff; border-radius: 24px; overflow: hidden;">
          <tr>
            <td align="center" style="padding: 46px 32px 34px;">
              <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 38px; line-height: 1; font-weight: 400; letter-spacing: -1.5px; color: #111111;">${companyName}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div style="height: 1px; background: #eeeeee; margin: 0 40px;"></div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 52px 40px 48px;">
              <div style="font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #2C5745; margin-bottom: 22px;">DELIVERY PARTNER APPLICATION</div>
              <h2 style="margin: 0 0 18px; font-size: 30px; line-height: 1.2; color: #111111;">You're approved</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #333333;">Hi ${firstName}, your delivery partner application has been approved. Please complete your setup to activate your account.</p>
              <a href="${setupUrl}" style="display: inline-block; background: #2C5745; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 700;">Complete your setup</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export default deliveryPartnerApplicationApprovedTemplate;
