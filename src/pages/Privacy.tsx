import { Shield, Lock, Eye, FileText } from "lucide-react";

const Privacy = () => {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground">Last updated: January 2026</p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold m-0">Information We Collect</h2>
            </div>
            <p className="text-muted-foreground">
              We collect information you provide directly to us, including:
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>Personal identification information (Name, CNIC, date of birth)</li>
              <li>Contact information (Email, phone number, address)</li>
              <li>Educational qualifications and certificates</li>
              <li>Employment preferences (province, domicile)</li>
              <li>Documents required for job applications</li>
              <li>Payment information</li>
            </ul>
          </section>

          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold m-0">How We Use Your Information</h2>
            </div>
            <p className="text-muted-foreground">We use the information we collect to:</p>
            <ul className="text-muted-foreground space-y-2">
              <li>Process and complete your job applications</li>
              <li>Communicate with you about your applications</li>
              <li>Send you notifications about application updates</li>
              <li>Verify your eligibility for jobs</li>
              <li>Improve our services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold m-0">Data Security</h2>
            </div>
            <p className="text-muted-foreground">
              We implement appropriate security measures to protect your personal information:
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>All data is encrypted in transit and at rest</li>
              <li>Access to personal data is restricted to authorized personnel</li>
              <li>Regular security audits are conducted</li>
              <li>Secure authentication mechanisms are in place</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your personal information for as long as necessary to provide our services 
              and fulfill the purposes outlined in this policy. After this period, your data will 
              be securely deleted or anonymized.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">Your Rights</h2>
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="text-muted-foreground space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for data processing</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">Cookies</h2>
            <p className="text-muted-foreground">
              We use cookies and similar technologies to enhance your experience, 
              analyze usage patterns, and maintain session security. You can control 
              cookie preferences through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">Third-Party Services</h2>
            <p className="text-muted-foreground">
              We may share your information with trusted third parties solely for the 
              purpose of completing your job applications. These parties are bound by 
              confidentiality agreements and cannot use your data for any other purpose.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us 
              through our chat support or email us at privacy@pakjobs.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
