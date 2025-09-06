import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$9",
    period: "/month",
    tokens: "10,000 tokens",
    description: "Perfect for individuals and small projects",
    features: [
      "10,000 processing tokens/month",
      "Up to 5 hours of audio",
      "10 languages supported",
      "Standard processing speed",
      "Basic export formats (SRT, TXT)",
      "Email support"
    ],
    popular: false
  },
  {
    name: "Professional",
    price: "$29",
    period: "/month", 
    tokens: "50,000 tokens",
    description: "Ideal for content creators and businesses",
    features: [
      "50,000 processing tokens/month",
      "Up to 30 hours of audio",
      "50+ languages supported",
      "Priority processing (5x faster)",
      "All export formats (SRT, VTT, TXT)",
      "Real-time generation",
      "Custom vocabulary",
      "Priority support"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    tokens: "200,000 tokens",
    description: "For large teams and high-volume usage",
    features: [
      "200,000 processing tokens/month",
      "Unlimited audio processing",
      "All languages + dialects",
      "Ultra-fast processing (10x)",
      "Custom integrations & API",
      "Bulk processing tools",
      "Advanced analytics",
      "Dedicated account manager",
      "SLA guarantee"
    ],
    popular: false
  }
];

export const Pricing = () => {
  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-fredoka text-4xl md:text-5xl font-bold mb-4">
            Simple Token-Based Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Pay only for what you use with our transparent token system. 
            Powered by Polar.sh for seamless billing and token management.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <GlassCard 
              key={index}
              variant={plan.popular ? "glow" : "hover"}
              className={`relative ${plan.popular ? 'scale-105 shadow-glow-strong' : ''}`}
              style={{ 
                animationDelay: `${index * 150}ms`,
                animation: 'slide-up 0.8s var(--ease-out-expo) forwards'
              }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1 rounded-full font-fredoka">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="font-fredoka text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-lg text-muted-foreground">{plan.period}</span>
                </div>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-fredoka font-medium text-primary">{plan.tokens}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <Button 
                size="lg" 
                variant={plan.popular ? "default" : "outline"}
                className="w-full mb-6 font-fredoka font-medium rounded-xl"
              >
                Get Started
              </Button>

              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>

        {/* Token explanation */}
        <div className="mt-16 text-center">
          <GlassCard variant="default" className="max-w-2xl mx-auto">
            <h3 className="font-fredoka text-xl font-semibold mb-3">How Tokens Work</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Our token system is simple: 1 token = ~1 second of audio processing. 
              This includes transcription, translation, and subtitle generation. 
              Unused tokens roll over to the next month, so you never lose what you've paid for.
            </p>
          </GlassCard>
        </div>
      </div>
    </section>
  );
};