package com.neonix.mail.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neonix.mail.model.EmailRequest;
import com.neonix.mail.service.MailService;
import com.neonix.mail.util.EncryptionUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/mail")
@CrossOrigin(origins = "http://localhost:3000")
public class MailController {

    private final MailService mailService;
    private final EncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;

    public MailController(MailService mailService, EncryptionUtil encryptionUtil) {
        this.mailService = mailService;
        this.encryptionUtil = encryptionUtil;
        this.objectMapper = new ObjectMapper();
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMail(@RequestParam("encrypted") String encrypted) {

        try {
            String decryptedJson = encryptionUtil.decrypt(encrypted);
            EmailRequest emailReq = objectMapper.readValue(decryptedJson, EmailRequest.class);
            return sendEmailWithAttachments(emailReq, null);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @PostMapping("/send-with-attachments")
    public ResponseEntity<?> sendMailWithAttachments(
            @RequestParam("encrypted") String encrypted,
            @RequestParam(value = "files", required = false) MultipartFile[] files) {
        try {
            String decryptedJson = encryptionUtil.decrypt(encrypted);
            EmailRequest emailReq = objectMapper.readValue(decryptedJson, EmailRequest.class);
            return sendEmailWithAttachments(emailReq, files);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    private ResponseEntity<?> sendEmailWithAttachments(EmailRequest request, MultipartFile[] files) {
        try {
            EmailRequest emailReq;
            
            if (request.getEncrypted() != null && !request.getEncrypted().isEmpty()) {
                String decryptedJson = encryptionUtil.decrypt(request.getEncrypted());
                emailReq = objectMapper.readValue(decryptedJson, EmailRequest.class);
            } else {
                emailReq = request;
            }

            String result = mailService.sendMail(
                emailReq.getFrom(),
                emailReq.getTo(),
                emailReq.getCc(),
                emailReq.getBcc(),
                emailReq.getSubject(),
                emailReq.getBody(),
                emailReq.getSmtpHost(),
                emailReq.getSmtpPort(),
                emailReq.getUsername(),
                emailReq.getPassword(),
                emailReq.isUseTls(),
                files
            );
            return ResponseEntity.ok(Map.of("status", "success", "message", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
