import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";

const monthlyPlans = [{
  name: "Basic",
  price: "$19.99",
  period: "/month",
  tokens: "100 tokens",
  description: "Ideal for individual users or small creators",
  features: ["100 tokens/month", "Video transcription and translation", "25 languages supported", "Secure video storage", "Basic support", "Unused tokens don't expire"],
  popular: false,
  productId: "81152fa6-ca1a-465f-9c3d-384dc8c6a8a9",
  checkoutUrl: "https://buy.polar.sh/polar_cl_kMANTyyNaBCkcfUo1aJ5uKu2DkhBF4ipQYJem43NY6W"
}, {
  name: "Pro",
  price: "$99.99",
  period: "/month",
  tokens: "500 tokens",
  description: "Suited for growing creators or small businesses",
  features: ["500 tokens/month", "All Basic features", "Priority support", "Custom subtitle styling", "Font, size, position options", "Advanced processing"],
  popular: true,
  productId: "fafc1617-826a-4f61-ba37-3fe0a1dce8d9",
  checkoutUrl: "https://buy.polar.sh/polar_cl_Tliw1m9lc7bcQ3EfSWBenC5i2s22ujnKHy26r0pfiil"
}, {
  name: "Premium",
  price: "$359.99",
  period: "/month",
  tokens: "1,800 tokens",
  description: "Designed for professional users or businesses",
  features: ["1,800 tokens/month", "All Pro features", "Enhanced processing speed", "Advanced customization options", "Priority processing queue", "Dedicated support"],
  popular: false,
  productId: "e2a82b41-2a06-46b9-84ea-d196f758f2b2",
  checkoutUrl: "https://buy.polar.sh/polar_cl_Y3Znzem1OYAsPCF3hSxP6dkoG44iYrKgPAHic1MjMOi"
}, {
  name: "Custom",
  price: "Variable",
  period: "",
  tokens: "Variable tokens",
  description: "Tailored for enterprises or high-volume users",
  features: ["Flexible token allocation", "Personalized support", "Custom integrations", "Enterprise SLA", "Dedicated account manager", "Custom pricing negotiation"],
  popular: false,
  productId: "dbf10011-1973-4639-9723-81fd8d4f96c1",
  checkoutUrl: "https://buy.polar.sh/polar_cl_6vL2qZ4pIDPkzWZsXAeHcIFYlojx5TJKvklIW1UMhPO"
}];

const yearlyPlans = [{
  name: "Basic",
  price: "$238.99",
  period: "/year",
  tokens: "1,200 tokens",
  description: "Ideal for individual users or small creators",
  features: ["1,200 tokens/year", "Video transcription and translation", "25 languages supported", "Secure video storage", "Basic support", "20% yearly savings"],
  popular: false,
  productId: "64da80d5-3fe4-4a76-84d0-e56c607ffe61",
  checkoutUrl: "https://buy.polar.sh/polar_cl_sHe3MBHYXlwezDiO7cAj8ZnRQTtD6MhE7pwgy0H05YD"
}, {
  name: "Pro",
  price: "$1,198.99",
  period: "/year",
  tokens: "6,000 tokens",
  description: "Suited for growing creators or small businesses",
  features: ["6,000 tokens/year", "All Basic features", "Priority support", "Custom subtitle styling", "Font, size, position options", "20% yearly savings"],
  popular: true,
  productId: "2540c60b-9ef0-4c22-a1ce-7c2ab2ba9fda",
  checkoutUrl: "https://buy.polar.sh/polar_cl_m2n4kxBPT0WBtyNKWHo6wN05Wk7QmNMfkx6eU0zkM4k"
}, {
  name: "Premium",
  price: "$4,318.99",
  period: "/year",
  tokens: "21,600 tokens",
  description: "Designed for professional users or businesses",
  features: ["21,600 tokens/year", "All Pro features", "Enhanced processing speed", "Advanced customization options", "Priority processing queue", "20% yearly savings"],
  popular: false,
  productId: "1b319610-f033-4915-ba8a-71515342cc49",
  checkoutUrl: "https://buy.polar.sh/polar_cl_uRpszpsHKmwTyKLiFM1mphRQS3yKDURSGBbjY25SCSs"
}, {
  name: "Custom",
  price: "Variable",
  period: "",
  tokens: "Variable tokens",
  description: "Tailored for enterprises or high-volume users",
  features: ["Flexible token allocation", "Personalized support", "Custom integrations", "Enterprise SLA", "Dedicated account manager", "Custom pricing negotiation"],
  popular: false,
  productId: "91e74ded-3e16-4511-b299-f10b35778870",
  checkoutUrl: "https://buy.polar.sh/polar_cl_feKNJww7PMRcA7VKxkoBDjRNfkFML4GTihGaE1riZkm"
}];

export const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const currentPlans = isYearly ? yearlyPlans : monthlyPlans;
  
  const handleGetStarted = (checkoutUrl: string) => {
    window.open(checkoutUrl, '_blank');
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden" id="pricing">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/3 to-transparent animate-pulse" style={{animationDelay: '2s'}}></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-bounce" style={{animationDuration: '3s'}}></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
      
      <div className="relative z-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-fredoka font-bold mb-6 text-foreground">
            Choose Your <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Plan</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get started with our flexible pricing options designed for every creator's needs
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${!isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button 
              onClick={() => setIsYearly(!isYearly)} 
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isYearly ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isYearly ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
              Yearly
              <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                20% OFF
              </Badge>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {currentPlans.map((plan, index) => (
            <GlassCard 
              key={index} 
              className={`relative transition-all duration-500 hover:scale-105 ${
                plan.popular ? 'scale-105 shadow-glow-strong border-primary/20' : 'hover:shadow-glow-soft'
              } rounded-3xl p-8`}
              style={{
                animationDelay: `${index * 150}ms`,
                animation: 'fade-in 0.8s ease-out forwards'
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
                <h3 className="font-fredoka text-2xl font-bold mb-2 text-foreground">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
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
                onClick={() => window.location.href = '/dashboard'}
              >
                Get Started
              </Button>

              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>

        {/* Token explanation */}
        <div className="mt-16 text-center">
          <GlassCard className="p-6 max-w-2xl mx-auto">
            <h3 className="font-fredoka text-xl font-bold mb-3 text-foreground">How Tokens Work</h3>
            <p className="text-muted-foreground">
              1 token = 10MB of video processing. Tokens are used for AI subtitle generation and video export. 
              Unused tokens never expire, giving you complete flexibility.
            </p>
          </GlassCard>
        </div>
      </div>
    </section>
  );
};