import React from "react";
import { Button } from "@/components/ui/button";
import { LogIn, Mail, Lock, ArrowLeft, Loader2, KeyRound, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUser } from "../context/UserContext";

function Login() {
  const navigate = useNavigate();
  const { login, user } = useUser();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loginMethod, setLoginMethod] = React.useState("password"); // "password" or "otp"
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpTimer, setOtpTimer] = React.useState(0);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [resetStep, setResetStep] = React.useState(1); // 1: email, 2: otp & new password
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    otp: "",
    newPassword: "",
    resetEmail: "",
    resetOTP: "",
  });

  // Redirect to dashboard if already logged in
  React.useEffect(() => {
    console.log("user", user);
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // OTP Timer countdown
  React.useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to login");
      }
      
      const data = await response.json();
      
      // Update user context
      if (data && data.id) {
        login(data);
        toast.success("Login successful!");
        
        // Clear history and navigate to dashboard
        window.history.replaceState(null, '', '/dashboard');
        navigate("/dashboard", { replace: true });
      }
      
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!formData.email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/send-login-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send OTP");
      }

      setOtpSent(true);
      setOtpTimer(300); // 5 minutes
      toast.success("OTP sent to your email!");
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/login-with-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to login with OTP");
      }

      const data = await response.json();
      
      // Update user context
      if (data && data.id) {
        login(data);
        toast.success("Login successful!");
        
        // Clear history and navigate to dashboard
        window.history.replaceState(null, '', '/dashboard');
        navigate("/dashboard", { replace: true });
      }
      
    } catch (error) {
      console.error("OTP Login error:", error);
      toast.error(error.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const resetOTPState = () => {
    setOtpSent(false);
    setOtpTimer(0);
    setFormData((prev) => ({ ...prev, otp: "" }));
  };

  const handleSendPasswordResetOTP = async () => {
    if (!formData.resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.resetEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send password reset OTP");
      }

      setResetStep(2);
      setOtpTimer(600); // 10 minutes
      toast.success("Password reset OTP sent to your email!");
    } catch (error) {
      console.error("Send reset OTP error:", error);
      toast.error(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.resetEmail,
          otp: formData.resetOTP,
          newPassword: formData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password");
      }

      toast.success("Password reset successfully! Please login with your new password.");
      setShowForgotPassword(false);
      setResetStep(1);
      setFormData((prev) => ({
        ...prev,
        resetEmail: "",
        resetOTP: "",
        newPassword: "",
      }));
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Back to Home Link */}
          <div className="mb-6">
            <a
              href="/"
              className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </a>
          </div>

          {/* Login Card */}
          <div className="rounded-lg border bg-white p-8 shadow-lg sm:p-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <LogIn className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
                Welcome Back
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Please enter your credentials to login
              </p>
            </div>

            {/* Login Method Toggle */}
            {!showForgotPassword && (
              <div className="mb-6 flex rounded-lg border bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("password");
                    resetOTPState();
                  }}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    loginMethod === "password"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Lock className="mr-2 inline-block h-4 w-4" />
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("otp");
                    setFormData((prev) => ({ ...prev, password: "" }));
                  }}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    loginMethod === "otp"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <KeyRound className="mr-2 inline-block h-4 w-4" />
                  OTP
                </button>
              </div>
            )}

            {/* Forgot Password Flow */}
            {showForgotPassword && (
              <div className="space-y-6">
                <div className="mb-4 flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetStep(1);
                      setFormData((prev) => ({
                        ...prev,
                        resetEmail: "",
                        resetOTP: "",
                        newPassword: "",
                      }));
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="mr-2 inline-block h-4 w-4" />
                    Back to Login
                  </button>
                </div>

                <div className="mb-4 text-center">
                  <h3 className="text-lg font-semibold">Reset Password</h3>
                  <p className="text-sm text-muted-foreground">
                    {resetStep === 1
                      ? "Enter your email to receive a reset code"
                      : "Enter the OTP and your new password"}
                  </p>
                </div>

                {resetStep === 1 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="resetEmail"
                        className="text-sm font-medium text-foreground"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <input
                          type="email"
                          id="resetEmail"
                          name="resetEmail"
                          value={formData.resetEmail}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleSendPasswordResetOTP}
                      className="w-full bg-blue-600 text-base hover:bg-blue-700"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        "Send Reset Code"
                      )}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="resetOTP"
                          className="text-sm font-medium text-foreground"
                        >
                          Reset Code (OTP)
                        </label>
                        {otpTimer > 0 && (
                          <span className="flex items-center text-xs text-muted-foreground">
                            <Timer className="mr-1 h-3 w-3" />
                            {formatTime(otpTimer)}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <KeyRound className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <input
                          type="text"
                          id="resetOTP"
                          name="resetOTP"
                          value={formData.resetOTP}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          placeholder="Enter 6-digit code"
                          maxLength="6"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="newPassword"
                        className="text-sm font-medium text-foreground"
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          placeholder="Enter new password"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 text-base hover:bg-blue-700"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setResetStep(1);
                          handleSendPasswordResetOTP();
                        }}
                        disabled={otpTimer > 540 || isLoading}
                        className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                      >
                        {otpTimer > 540
                          ? "Please wait before resending"
                          : "Resend Reset Code"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Password Login Form */}
            {!showForgotPassword && loginMethod === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-foreground"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-blue-600 text-base hover:bg-blue-700"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            )}

            {/* OTP Login Form */}
            {!showForgotPassword && loginMethod === "otp" && (
              <div className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="email-otp"
                    className="text-sm font-medium text-foreground"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type="email"
                      id="email-otp"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="you@example.com"
                      disabled={otpSent}
                      required
                    />
                  </div>
                </div>

                {!otpSent ? (
                  <Button
                    type="button"
                    onClick={handleSendOTP}
                    className="w-full bg-blue-600 text-base hover:bg-blue-700"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-5 w-5" />
                        Send OTP
                      </>
                    )}
                  </Button>
                ) : (
                  <form onSubmit={handleOTPLogin} className="space-y-4">
                    {/* OTP Field */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="otp"
                          className="text-sm font-medium text-foreground"
                        >
                          Enter OTP
                        </label>
                        {otpTimer > 0 && (
                          <span className="flex items-center text-xs text-muted-foreground">
                            <Timer className="mr-1 h-3 w-3" />
                            {formatTime(otpTimer)}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <KeyRound className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <input
                          type="text"
                          id="otp"
                          name="otp"
                          value={formData.otp}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          placeholder="Enter 6-digit OTP"
                          maxLength="6"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Check your email for the OTP code
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 text-base hover:bg-blue-700"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify & Sign In"
                      )}
                    </Button>

                    {/* Resend OTP */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          resetOTPState();
                          handleSendOTP();
                        }}
                        disabled={otpTimer > 240 || isLoading}
                        className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                      >
                        {otpTimer > 240
                          ? "Please wait before resending"
                          : "Resend OTP"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Footer Note */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By logging in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;