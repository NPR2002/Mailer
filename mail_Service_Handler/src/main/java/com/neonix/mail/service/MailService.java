package com.neonix.mail.service;

import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;

import java.util.Properties;

@Service
public class MailService {

    public String sendMail(String from, String to, String cc, String bcc, String subject, String body,
                           String smtpHost, int smtpPort, String username, String password, boolean useTls,
                           MultipartFile[] files) {

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(smtpHost);
        mailSender.setPort(smtpPort);
        mailSender.setUsername(username);
        mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", String.valueOf(useTls));
        props.put("mail.smtp.ssl.trust", smtpHost);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();

            // true = multipart (needed for attachments)
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(from);

            if (to != null && !to.isEmpty()) {
                helper.setTo(to.split(","));
            }
            if (cc != null && !cc.isEmpty()) {
                helper.setCc(cc.split(","));
            }
            if (bcc != null && !bcc.isEmpty()) {
                helper.setBcc(bcc.split(","));
            }

            helper.setSubject(subject);
            helper.setText(convertToHtml(body), true);

            if (files != null) {
                for (MultipartFile file : files) {
                    if (file != null && !file.isEmpty()) {
                        ByteArrayDataSource dataSource = new ByteArrayDataSource(
                                file.getBytes(),
                                file.getContentType()
                        );
                        dataSource.setName(file.getOriginalFilename());

                        helper.addAttachment(file.getOriginalFilename(), dataSource);
                    }
                }
            }

            mailSender.send(mimeMessage);
            return "Email sent successfully";

        } catch (Exception e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    private String convertToHtml(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }

        String html = text;

        // Bold: **text**
        html = html.replaceAll("\\*\\*(.+?)\\*\\*", "<strong>$1</strong>");

        // Italic: _text_
        html = html.replaceAll("_(.+?)_", "<em>$1</em>");

        // Line breaks
        html = html.replace("\n", "<br>");

        return html;
    }
}