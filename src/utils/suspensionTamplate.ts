type SuspensionEmailStatus = 'APPROVED' | 'REJECTED';

interface ISuspensionEmailTemplate {
  userName?: string;
  status: SuspensionEmailStatus;
  reviewNote?: string;
}

const suspensionTemplate = ({
  userName = 'User',
  status,
  reviewNote,
}: ISuspensionEmailTemplate) => {
  const isApproved = status === 'APPROVED';

  const subject = isApproved
    ? 'Your Suspension Appeal Has Been Approved'
    : 'Your Suspension Appeal Has Been Rejected';

  const title = isApproved ? 'Suspension Appeal Approved' : 'Suspension Appeal Rejected';

  const message = isApproved
    ? `
      Your suspension appeal has been reviewed and approved.

      Your account has been restored and is now active.
      You can log in and continue using your account.
    `
    : `
      Your suspension appeal has been reviewed and rejected.

      Your account will remain suspended and you will not be able
      to access the platform until the suspension is lifted.
    `;

  return {
    subject,

    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${subject}</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            font-family: Arial, Helvetica, sans-serif;
          "
        >
          <div
            style="
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              border: 1px solid #e5e5e5;
            "
          >
            <div
              style="
                padding: 24px;
                background: #111827;
                color: #ffffff;
              "
            >
              <h2 style="margin: 0;">
                ${title}
              </h2>
            </div>

            <div style="padding: 30px;">
              <p style="font-size: 16px;">
                Hello ${userName},
              </p>

              <p style="font-size: 15px; line-height: 1.7;">
                ${message}
              </p>

              ${
                reviewNote
                  ? `
                    <div
                      style="
                        margin: 24px 0;
                        padding: 16px;
                        background: #f9fafb;
                        border-left: 4px solid #6b7280;
                      "
                    >
                      <strong>Admin Review Note</strong>

                      <p
                        style="
                          margin: 8px 0 0;
                          line-height: 1.6;
                          color: #374151;
                        "
                      >
                        ${reviewNote}
                      </p>
                    </div>
                  `
                  : ''
              }

              ${
                isApproved
                  ? `
                    <p style="font-size: 15px; line-height: 1.7;">
                      You may now log in to your account and continue
                      using our platform normally.
                    </p>
                  `
                  : `
                    <p style="font-size: 15px; line-height: 1.7;">
                      If you believe this decision was made incorrectly,
                      please contact our support team for further assistance.
                    </p>
                  `
              }

              <p style="margin-top: 30px;">
                Regards,<br />
                <strong>Multi-Vendor Marketplace Team</strong>
              </p>
            </div>

            <div
              style="
                padding: 16px;
                text-align: center;
                background: #f9fafb;
                color: #6b7280;
                font-size: 12px;
              "
            >
              This is an automated email. Please do not reply directly
              to this email.
            </div>
          </div>
        </body>
      </html>
    `,
  };
};

export default suspensionTemplate;
