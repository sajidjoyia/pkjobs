import { FileText, AlertTriangle, Scale } from "lucide-react";

const Terms = () => {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Scale className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-muted-foreground">Last updated: January 2026</p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using PakJobs ("the Service"), you accept and agree to be bound by 
              these Terms of Service. If you do not agree to these terms, you should not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">2. Description of Service</h2>
            <p className="text-muted-foreground">
              PakJobs provides a platform that facilitates government job applications in Pakistan. 
              Our services include:
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>Listing of available government job positions</li>
              <li>Expert assistance with job application processing</li>
              <li>Document management and verification</li>
              <li>Application status tracking</li>
              <li>Communication between users and our support team</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">3. User Accounts</h2>
            <p className="text-muted-foreground">To use certain features of the Service, you must:</p>
            <ul className="text-muted-foreground space-y-2">
              <li>Create an account with accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be at least 18 years old or have parental consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">4. User Responsibilities</h2>
            <p className="text-muted-foreground">You agree to:</p>
            <ul className="text-muted-foreground space-y-2">
              <li>Provide accurate and truthful information in all applications</li>
              <li>Submit authentic documents only</li>
              <li>Not misrepresent your qualifications or eligibility</li>
              <li>Use the Service only for lawful purposes</li>
              <li>Not interfere with or disrupt the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">5. Payment Terms</h2>
            <p className="text-muted-foreground">
              All fees are displayed clearly on job listings. Payment is required before 
              application processing begins. Fees cover:
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>Government-mandated challan fees</li>
              <li>Post office and courier charges</li>
              <li>Document processing costs</li>
              <li>Expert service fees</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">6. Refund Policy</h2>
            <p className="text-muted-foreground">
              Refunds may be provided in the following circumstances:
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>Service not rendered due to our error</li>
              <li>Duplicate payments</li>
              <li>Job position cancelled by the hiring authority before application submission</li>
            </ul>
            <p className="text-muted-foreground">
              Refunds will not be provided after the application has been submitted to the 
              relevant authority.
            </p>
          </section>

          <section className="mb-8 p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <h2 className="text-xl font-semibold m-0">7. Disclaimer</h2>
            </div>
            <p className="text-muted-foreground m-0">
              PakJobs assists with the application process only. We do not guarantee job 
              placement or selection. Final decisions rest with the respective hiring authorities. 
              We are not affiliated with any government department.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, PakJobs shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages resulting from 
              your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">9. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content, trademarks, and other intellectual property on the Service are 
              owned by PakJobs or its licensors. You may not copy, modify, or distribute 
              any content without our written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">10. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account at any time for violation of these 
              terms or for any other reason at our discretion. You may terminate your account 
              at any time by contacting our support team.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">11. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Continued use of the 
              Service after changes constitutes acceptance of the new terms. We will notify 
              users of significant changes via email or platform notification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">12. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms shall be governed by and construed in accordance with the laws of 
              Pakistan. Any disputes shall be subject to the exclusive jurisdiction of the 
              courts in Pakistan.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">13. Contact Information</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, please contact us through our 
              chat support or email us at legal@pakjobs.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
