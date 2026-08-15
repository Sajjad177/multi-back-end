import { companyName } from '../lib/globalType';

const verificationCodeTemplate = (code: string) => `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Verify your ${companyName} account</title>
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


          <!-- Minimal Divider -->
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


          <!-- Main Content -->
          <tr>
            <td
              align="center"
              style="
                padding: 52px 40px 48px;
              "
            >

              <!-- Small Label -->
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
                VERIFY EMAIL
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
                Welcome to ${companyName}
              </h1>


              <!-- Description -->
              <p
                style="
                  max-width: 390px;
                  margin: 18px auto 0;
                  font-size: 14px;
                  line-height: 1.7;
                  color: #777777;
                "
              >
                Enter the code below to verify your email address.
              </p>


              <!-- OTP -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  margin-top: 36px;
                "
              >

                <tr>
                  <td align="center">

                    <div
                      style="
                        display: inline-block;
                        min-width: 230px;
                        padding: 22px 28px;
                        background: #f7f6f3;
                        border-radius: 16px;
                        border: 1px solid #ebe9e4;
                        box-sizing: border-box;
                      "
                    >

                      <div
                        style="
                          font-size: 34px;
                          line-height: 1;
                          font-weight: 600;
                          letter-spacing: 9px;
                          color: #2C5745;
                          padding-left: 9px;
                        "
                      >
                        ${code}
                      </div>

                    </div>

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
                Expires in 5 minutes
              </p>

            </td>
          </tr>


          <!-- Bottom Accent -->
          <tr>
            <td
              style="
                height: 5px;
                background: #2C5745;
              "
            ></td>
          </tr>

        </table>


        <!-- Very Minimal Copyright -->
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

export default verificationCodeTemplate;
