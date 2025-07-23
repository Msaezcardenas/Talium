import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📧 Send invitation API called with:', body)
    
    const { assignmentId, candidateEmail, candidateName, interviewTitle, token } = body
    
    // Usar NEXT_PUBLIC_SITE_URL o NEXT_PUBLIC_APP_URL o localhost como fallback
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invitationLink = `${appUrl}/interview/${token}`
    
    // Para desarrollo, simularemos el envío de email si no hay credenciales de Gmail
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS || process.env.NODE_ENV === 'development') {
      console.log('📧 Running in development mode or no Gmail credentials')
      console.log('=== EMAIL SIMULADO ===')
      console.log(`Para: ${candidateEmail}`)
      console.log(`Asunto: Invitación a Entrevista - ${interviewTitle}`)
      console.log(`\nHola${candidateName && candidateName.trim() ? ` ${candidateName}` : ''},\n\nHas sido seleccionado para participar en el proceso de entrevista para: ${interviewTitle}\n\nPara acceder a tu entrevista, haz clic en el siguiente enlace:\n${invitationLink}\n\nEste enlace es único y personal. No lo compartas con nadie más.\n\nSaludos,\nEquipo de Talium\n      `)
      console.log('=== FIN EMAIL ===')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Invitación enviada (modo desarrollo)',
        invitationLink, // En desarrollo, devolvemos el link para testing
        debug: {
          mode: 'development',
          hasGmail: !!process.env.GMAIL_USER,
          email: candidateEmail
        }
      })
    }

    // Envío real con nodemailer (Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    })

    const mailOptions = {
      from: `Talium <${process.env.GMAIL_USER}>`,
      to: candidateEmail,
      subject: `Invitación a Entrevista - ${interviewTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #7c3aed, #a855f7); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Talium</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #111827;">Hola${candidateName && candidateName.trim() ? ` ${candidateName}` : ''},</h2>
            <p style="color: #6b7280; line-height: 1.6;">
              Has sido seleccionado para participar en el proceso de entrevista para:
            </p>
            <h3 style="color: #7c3aed;">${interviewTitle}</h3>
            <p style="color: #6b7280; line-height: 1.6;">
              Para acceder a tu entrevista, haz clic en el siguiente botón:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" 
                 style="display: inline-block; padding: 12px 30px; background: linear-gradient(to right, #7c3aed, #a855f7); 
                        color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Comenzar Entrevista
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              O copia y pega este enlace en tu navegador:<br>
              <code style="background: #e5e7eb; padding: 5px; border-radius: 4px;">${invitationLink}</code>
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px;">
              Este enlace es único y personal. No lo compartas con nadie más.
            </p>
          </div>
        </div>
      `,
    }

    const emailResponse = await transporter.sendMail(mailOptions)
    console.log('📧 Respuesta de nodemailer:', emailResponse)

    return NextResponse.json({ 
      success: true, 
      message: 'Invitación enviada correctamente',
      emailId: emailResponse.messageId, // ID del email para rastrear
      debug: {
        to: candidateEmail,
        from: process.env.GMAIL_USER,
        messageId: emailResponse.messageId
      }
    })

  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Error al enviar invitación' },
      { status: 500 }
    )
  }
} 