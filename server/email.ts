import nodemailer from 'nodemailer';

const transporter = process.env.SMTP_USER && process.env.SMTP_PASS 
  ? nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  baseUrl: string
): Promise<boolean> {
  if (!transporter) {
    console.error('SMTP_USER e SMTP_PASS non configurate');
    return false;
  }

  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: to,
      subject: 'Reset Password - Trading Journal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset della Password</h2>
          <p>Hai richiesto il reset della password per il tuo account Trading Journal.</p>
          <p>Clicca sul pulsante qui sotto per impostare una nuova password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #0066cc; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Reimposta Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Questo link scadrà tra 1 ora.<br>
            Se non hai richiesto il reset, ignora questa email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Trading Journal</p>
        </div>
      `,
    });

    console.log('Email di reset password inviata a:', to);
    return true;
  } catch (error) {
    console.error('Errore invio email:', error);
    return false;
  }
}
