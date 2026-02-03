"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Eye,
  EyeOff,
  Receipt,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Building2,
  User,
} from "lucide-react";
import { toast } from "sonner";

export function Register() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [businessData, setBusinessData] = useState({
    businessName: "",
    businessCode: "",
    email: "",
    phone: "",
    address: "",
    brandColor: "#0F172A",
  });

  const [ownerData, setOwnerData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "businessCode") {
      // Only allow uppercase letters and numbers, max 6 characters
      const sanitized = value.replace(/[^A-Z0-9]/g, "").slice(0, 6);
      setBusinessData((prev) => ({ ...prev, [name]: sanitized }));
    } else {
      setBusinessData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOwnerData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusinessData((prev) => ({ ...prev, brandColor: e.target.value }));
  };

  const validateStep1 = () => {
    if (!businessData.businessName.trim()) {
      toast.error("Business name is required");
      return false;
    }
    if (businessData.businessCode.length < 3) {
      toast.error("Business code must be at least 3 characters");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ownerData.password !== ownerData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (ownerData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!ownerData.email.trim() || !ownerData.email.includes("@")) {
      toast.error("Valid owner email is required");
      return;
    }

    setIsLoading(true);

    try {
      // Match backend API structure exactly
      const payload = {
        business: {
          name: businessData.businessName,
          businessCode: businessData.businessCode,
          ...(businessData.email && { email: businessData.email }),
          ...(businessData.phone && { phone: businessData.phone }),
          ...(businessData.address && { address: businessData.address }),
        },
        owner: {
          email: ownerData.email,
          password: ownerData.password,
        },
        branding: {
          primaryColor: businessData.brandColor,
        },
      };

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

      const response = await fetch(`${API_URL}/v1/setup/owner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Setup failed");
      }

      const data = await response.json();

      toast.success("Setup completed successfully! Please login.");
      navigate("/login");
    } catch (error: any) {
      console.error("Setup error:", error);
      toast.error(
        error.message || "Failed to complete setup. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4"
          >
            <Receipt className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Setup Your Business
          </h1>
          <p className="text-muted-foreground">
            Complete the setup to start managing invoices
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep >= 1
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                <Building2 className="w-5 h-5" />
              </div>
              <span
                className={`ml-2 text-sm font-medium ${currentStep >= 1 ? "text-foreground" : "text-muted-foreground"}`}
              >
                Business
              </span>
            </div>
            <div
              className={`w-16 h-0.5 transition-colors ${currentStep >= 2 ? "bg-primary" : "bg-border"}`}
            />
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep >= 2
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                <User className="w-5 h-5" />
              </div>
              <span
                className={`ml-2 text-sm font-medium ${currentStep >= 2 ? "text-foreground" : "text-muted-foreground"}`}
              >
                Owner Account
              </span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1
                ? "Step 1: Business Information"
                : "Step 2: Owner Account"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1
                ? "Enter your business details and branding"
                : "Create your owner account to access the system"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {currentStep === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        type="text"
                        placeholder="Acme Corporation"
                        value={businessData.businessName}
                        onChange={handleBusinessChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessCode">Business Code *</Label>
                      <Input
                        id="businessCode"
                        name="businessCode"
                        type="text"
                        placeholder="ACM"
                        value={businessData.businessCode}
                        onChange={handleBusinessChange}
                        maxLength={6}
                        required
                        className="uppercase"
                      />
                      <p className="text-xs text-muted-foreground">
                        3-6 uppercase letters/numbers
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Business Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="contact@acme.com"
                        value={businessData.email}
                        onChange={handleBusinessChange}
                      />
                      <p className="text-xs text-muted-foreground">Optional</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={businessData.phone}
                        onChange={handleBusinessChange}
                      />
                      <p className="text-xs text-muted-foreground">Optional</p>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="address">Business Address</Label>
                      <Input
                        id="address"
                        name="address"
                        type="text"
                        placeholder="123 Main St, City, State, ZIP"
                        value={businessData.address}
                        onChange={handleBusinessChange}
                      />
                      <p className="text-xs text-muted-foreground">Optional</p>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="brandColor">Brand Primary Color</Label>
                      <div className="flex gap-2">
                        <div className="relative">
                          <input
                            id="brandColor"
                            name="brandColor"
                            type="color"
                            value={businessData.brandColor}
                            onChange={handleColorChange}
                            className="w-12 h-10 rounded border border-input cursor-pointer"
                          />
                        </div>
                        <Input
                          type="text"
                          value={businessData.brandColor}
                          onChange={handleColorChange}
                          placeholder="#0F172A"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optional - defaults to #0F172A
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/login")}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                    <Button type="button" onClick={handleNextStep}>
                      Next Step
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail">Owner Email *</Label>
                    <Input
                      id="ownerEmail"
                      name="email"
                      type="email"
                      placeholder="owner@acme.com"
                      value={ownerData.email}
                      onChange={handleOwnerChange}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={ownerData.password}
                        onChange={handleOwnerChange}
                        required
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={ownerData.confirmPassword}
                        onChange={handleOwnerChange}
                        required
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      disabled={isLoading}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Setting Up...
                        </>
                      ) : (
                        "Complete Setup"
                      )}
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By completing setup, you agree to our Terms of Service and Privacy
          Policy.
        </p>
      </motion.div>
    </div>
  );
}
