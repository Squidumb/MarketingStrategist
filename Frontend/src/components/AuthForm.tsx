import { ErrorMessage, Field, Form, Formik } from "formik";
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link } from "@tanstack/react-router";
import type { ObjectSchema } from "yup";

type Values = { email: string; password: string };

export default function AuthForm({
  kind,
  validationSchema,
  onSubmit,
  passwordPlaceholder,
}: {
  kind: "login" | "signup";
  validationSchema: ObjectSchema<any>;
  onSubmit: (values: Values) => void | Promise<void>;
  passwordPlaceholder: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isLogin = kind === "login";

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="hidden flex-col justify-between border-r border-border bg-foreground p-12 text-background lg:flex">
        <div className="flex flex-1 items-center">
          <div className="text-left">
            <span className="label-mono text-background/50">
              {isLogin ? "Welcome back" : "Create account"}
            </span>
            <p className="display-xl mt-6 text-5xl">
              Marketing that
              <br />
              <span className="text-accent">wins.</span>
            </p>
          </div>
        </div>
        <span className="label-mono text-background/40">StratMan · Agentic AI</span>
      </aside>

      <main className="flex flex-col justify-center px-6 py-16 md:px-20">
        <div className="rise mx-auto w-full max-w-md">
          <img className="mb-10 h-6 w-auto lg:hidden" />
          <span className="label-mono">{isLogin ? "Step 01 / Access" : "Step 01 / Register"}</span>
          <h1 className="display-xl mt-4 text-5xl">{isLogin ? "Log in" : "Sign up"}</h1>

          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="mt-12 space-y-9">
                <div>
                  <label htmlFor="email" className="label-mono">
                    Email
                  </label>
                  <Field
                    id="email"
                    type="email"
                    name="email"
                    className="field-ink mt-2"
                    placeholder="user@gmail.com"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="mt-2 font-mono text-xs text-destructive"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="label-mono">
                    Password
                  </label>
                  <div className="relative">
                    <Field
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="field-ink mt-2 pr-8"
                      placeholder={passwordPlaceholder}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-0 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="mt-2 font-mono text-xs text-destructive"
                  />
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-ink w-full">
                  {isSubmitting
                    ? isLogin
                      ? "Logging in..."
                      : "Signing up..."
                    : isLogin
                      ? "Log in"
                      : "Sign up"}
                </button>
              </Form>
            )}
          </Formik>

          <p className="label-mono mt-10">
            {isLogin ? "New here? " : "Already a user? "}
            <Link to={isLogin ? "/signup" : "/login"} className="text-accent hover:underline">
              {isLogin ? "Sign up" : "Login"}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
