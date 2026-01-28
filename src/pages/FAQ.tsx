import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQ = () => {
  const faqs = [
    {
      question: "How does PakJobs work?",
      answer: "PakJobs simplifies your government job application process. Browse available positions, select the job you want to apply for, complete the payment, and our experts will handle the entire application process on your behalf. You can track your application status in real-time through your dashboard."
    },
    {
      question: "What documents do I need to provide?",
      answer: "Typically, you'll need to provide your CNIC, educational certificates (Matric, Intermediate, Bachelor's, etc.), domicile certificate, recent passport-size photographs, and any other job-specific documents. Our team will guide you on the exact requirements for each position."
    },
    {
      question: "How much does your service cost?",
      answer: "Our fee includes all associated costs: bank challan fees, post office charges, photocopy fees, and our expert service fee. The total cost is clearly displayed on each job listing. There are no hidden charges."
    },
    {
      question: "How long does the application process take?",
      answer: "Once we receive your payment and documents, our experts typically complete the application within 2-3 working days. You'll receive updates at each stage through notifications and can communicate directly with our team via chat."
    },
    {
      question: "Can I track my application status?",
      answer: "Yes! After applying, you can track your application status in real-time through your dashboard. You'll see updates like 'Payment Received', 'Expert Assigned', 'In Progress', 'Applied', and 'Completed'."
    },
    {
      question: "What if I'm not eligible for a job?",
      answer: "Our system automatically checks your eligibility based on your profile (age, education, province, gender). Jobs you're not eligible for will be clearly marked, and you won't be able to apply for them. This saves you time and money."
    },
    {
      question: "How can I contact support?",
      answer: "You can reach our support team through the chat widget available on every page. For logged-in users, you can also access detailed conversation history through your dashboard. Our team typically responds within a few hours."
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we take data security seriously. All your personal information and documents are encrypted and stored securely. We only use your data for the purpose of completing your job applications and never share it with third parties."
    },
    {
      question: "Can I apply for multiple jobs?",
      answer: "Absolutely! You can apply for as many jobs as you're eligible for. Each application is handled separately, and you can track all of them from your dashboard."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept various payment methods including bank transfers and mobile wallets. Detailed payment instructions are provided during the application process. You'll need to upload your payment receipt for verification."
    },
    {
      question: "What happens after my application is submitted?",
      answer: "Once submitted, we provide you with confirmation and all relevant documents. You'll receive admit cards (when issued) and any other correspondence from the hiring department through our platform."
    },
    {
      question: "Do you guarantee job placement?",
      answer: "We guarantee that your application will be completed accurately and submitted on time. However, the final selection depends on the hiring department's criteria and your performance in tests/interviews."
    },
  ];

  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">FAQ</h1>
          </div>
          <p className="text-muted-foreground">
            Find answers to commonly asked questions about our services
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 p-6 rounded-lg border bg-card text-center">
          <h3 className="text-lg font-semibold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground">
            Can't find what you're looking for? Use the chat widget to contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
