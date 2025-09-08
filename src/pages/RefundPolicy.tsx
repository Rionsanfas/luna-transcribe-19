import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { GlassCard } from "@/components/ui/glass-card";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <GlassCard className="p-8">
              <h1 className="text-4xl font-bold mb-8 text-center">Refund Policy</h1>
              <p className="text-muted-foreground mb-8 text-center">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold mb-4">1. General Refund Policy</h2>
                  <p className="text-muted-foreground">
                    At SubAI, we want you to be satisfied with our service. This refund policy outlines the circumstances under which refunds may be issued for token purchases and subscription fees.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">2. Token Purchases</h2>
                  <p className="text-muted-foreground mb-4">
                    Our token-based system operates under the following refund terms:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li><strong>Unused Tokens:</strong> Tokens that have not been used for video processing may be eligible for refund within 7 days of purchase</li>
                    <li><strong>Used Tokens:</strong> Tokens that have been consumed for video processing are generally non-refundable</li>
                    <li><strong>Technical Issues:</strong> If tokens are deducted due to service errors, we will refund or credit the affected tokens</li>
                    <li><strong>Bulk Purchases:</strong> Large token purchases may have different refund terms as specified at time of purchase</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">3. Subscription Refunds</h2>
                  <p className="text-muted-foreground mb-4">
                    For recurring subscription plans:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li><strong>Monthly Subscriptions:</strong> Refunds may be issued within 3 days of the billing date if no tokens have been used</li>
                    <li><strong>Annual Subscriptions:</strong> Prorated refunds may be available within 14 days of initial purchase</li>
                    <li><strong>Cancellation:</strong> You can cancel your subscription at any time, but refunds for the current billing period are not guaranteed</li>
                    <li><strong>Service Changes:</strong> If we make significant changes to our service, existing subscribers may request refunds</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">4. Refund Eligibility</h2>
                  <p className="text-muted-foreground mb-4">
                    Refunds may be issued in the following circumstances:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Technical failures that prevent service usage</li>
                    <li>Billing errors or duplicate charges</li>
                    <li>Service downtime exceeding our service level agreement</li>
                    <li>Unauthorized charges on your account</li>
                    <li>Significant service changes that affect functionality</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">5. Refund Exclusions</h2>
                  <p className="text-muted-foreground mb-4">
                    Refunds will NOT be issued for:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Change of mind after successful video processing</li>
                    <li>User error or misunderstanding of service features</li>
                    <li>Dissatisfaction with AI-generated subtitle quality (though we offer editing tools)</li>
                    <li>Account violations or terms of service breaches</li>
                    <li>Requests made after the applicable refund period</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">6. How to Request a Refund</h2>
                  <p className="text-muted-foreground mb-4">
                    To request a refund:
                  </p>
                  <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                    <li>Contact our support team at support@subai.com</li>
                    <li>Include your account email and transaction details</li>
                    <li>Provide the reason for your refund request</li>
                    <li>Allow 5-7 business days for review and processing</li>
                  </ol>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">7. Refund Processing</h2>
                  <p className="text-muted-foreground mb-4">
                    When a refund is approved:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Refunds will be processed to the original payment method</li>
                    <li>Processing time may vary by payment provider (3-10 business days)</li>
                    <li>You will receive email confirmation when the refund is initiated</li>
                    <li>Any associated tokens will be removed from your account</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">8. Partial Refunds</h2>
                  <p className="text-muted-foreground">
                    In some cases, we may offer partial refunds or service credits instead of full refunds. This may occur when part of the service has been utilized or when circumstances warrant a different resolution.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">9. Chargebacks</h2>
                  <p className="text-muted-foreground">
                    We encourage customers to contact us directly before initiating chargebacks with their payment provider. Chargebacks may result in account suspension pending resolution.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">10. Policy Changes</h2>
                  <p className="text-muted-foreground">
                    We reserve the right to modify this refund policy at any time. Changes will be posted on our website and take effect immediately. Existing purchases are subject to the policy in effect at the time of purchase.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
                  <p className="text-muted-foreground">
                    For refund requests or questions about this policy, please contact us at:
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Email: support@subai.com<br />
                    Subject: Refund Request - [Your Account Email]
                  </p>
                </section>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RefundPolicy;