import { TopNavigation } from "@/components/TopNavigation";
import { Footer } from "@/components/Footer";
import { GlassCard } from "@/components/ui/glass-card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <GlassCard className="p-8">
              <h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>
              <p className="text-muted-foreground mb-8 text-center">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                  <p className="text-muted-foreground mb-4">We collect the following types of information:</p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li><strong>Account Information:</strong> Email address, username, and profile data</li>
                    <li><strong>Video Content:</strong> Videos you upload for processing</li>
                    <li><strong>Usage Data:</strong> How you interact with our service</li>
                    <li><strong>Payment Information:</strong> Processed securely through our payment partner</li>
                    <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                  <p className="text-muted-foreground mb-4">We use your information to:</p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Provide and improve our video subtitle generation services</li>
                    <li>Process your videos using AI transcription technology</li>
                    <li>Manage your account and token balance</li>
                    <li>Communicate with you about your account and services</li>
                    <li>Ensure security and prevent fraud</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">3. Video Processing and AI</h2>
                  <p className="text-muted-foreground mb-4">
                    When you upload videos to SubAI:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Videos are processed using OpenAI's Whisper API for transcription</li>
                    <li>Audio is extracted and sent to AI services for subtitle generation</li>
                    <li>Processed videos are temporarily stored during editing sessions</li>
                    <li>You can delete your videos and associated data at any time</li>
                    <li>We do not use your content to train AI models</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
                  <p className="text-muted-foreground mb-4">
                    We implement appropriate security measures to protect your information:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Data is encrypted in transit and at rest</li>
                    <li>Videos are stored securely on cloud infrastructure</li>
                    <li>Access to personal data is restricted to authorized personnel</li>
                    <li>Regular security audits and updates</li>
                    <li>Automatic deletion of processed video files after 30 days</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">5. Data Sharing</h2>
                  <p className="text-muted-foreground mb-4">We may share your information with:</p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li><strong>Service Providers:</strong> OpenAI for transcription, cloud storage providers</li>
                    <li><strong>Payment Processors:</strong> To handle subscription and token purchases</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    We do not sell, trade, or rent your personal information to third parties.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
                  <p className="text-muted-foreground mb-4">You have the right to:</p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate information</li>
                    <li>Delete your account and associated data</li>
                    <li>Export your data</li>
                    <li>Opt out of certain communications</li>
                    <li>Withdraw consent for data processing</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
                  <p className="text-muted-foreground">
                    We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can manage cookie preferences through your browser settings.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
                  <p className="text-muted-foreground">
                    We retain your data only as long as necessary to provide our services or as required by law. Account data is kept while your account is active. Video files are automatically deleted after 30 days unless saved to your projects.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
                  <p className="text-muted-foreground">
                    Your data may be processed in countries other than your residence. We ensure appropriate safeguards are in place for international data transfers.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
                  <p className="text-muted-foreground">
                    Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
                  <p className="text-muted-foreground">
                    If you have any questions about this Privacy Policy, please contact us at privacy@subai.com
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

export default PrivacyPolicy;