import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { GlassCard } from "@/components/ui/glass-card";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <GlassCard className="p-8">
              <h1 className="text-4xl font-bold mb-8 text-center">Terms of Service</h1>
              <p className="text-muted-foreground mb-8 text-center">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                  <p className="text-muted-foreground">
                    By accessing and using SubAI ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                  <p className="text-muted-foreground mb-4">
                    SubAI is an AI-powered video subtitle generation and editing platform that allows users to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Upload videos (MP4, MOV formats)</li>
                    <li>Generate automatic subtitles using AI transcription</li>
                    <li>Edit and customize subtitle appearance and timing</li>
                    <li>Export videos with burned-in subtitles</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">3. Token System</h2>
                  <p className="text-muted-foreground mb-4">
                    Our service operates on a token-based system:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>1 token = 10MB of video processing</li>
                    <li>Tokens are deducted for subtitle generation and video export</li>
                    <li>Tokens are non-refundable and non-transferable</li>
                    <li>Unused tokens do not expire</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
                  <p className="text-muted-foreground mb-4">You agree to:</p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Provide accurate account information</li>
                    <li>Upload only content you own or have rights to use</li>
                    <li>Not upload copyrighted content without permission</li>
                    <li>Not use the service for illegal or harmful purposes</li>
                    <li>Maintain the security of your account credentials</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">5. Content Policy</h2>
                  <p className="text-muted-foreground mb-4">
                    You retain ownership of your uploaded content. However, you grant us a limited license to process your content for the purpose of providing our services. We reserve the right to remove content that violates our policies.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">6. Privacy and Data</h2>
                  <p className="text-muted-foreground">
                    Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">7. Service Availability</h2>
                  <p className="text-muted-foreground">
                    We strive to maintain service availability but do not guarantee uninterrupted access. We may temporarily suspend service for maintenance or updates.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
                  <p className="text-muted-foreground">
                    SubAI is provided "as is" without warranties. We are not liable for any damages arising from your use of the service, including but not limited to data loss, business interruption, or accuracy of AI-generated content.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
                  <p className="text-muted-foreground">
                    We reserve the right to modify these terms at any time. Changes will be effective upon posting. Continued use of the service constitutes acceptance of updated terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
                  <p className="text-muted-foreground">
                    If you have questions about these Terms of Service, please contact us at legal@subai.com
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

export default TermsOfService;