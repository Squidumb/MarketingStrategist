import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as Yup from "yup";
import AuthForm from "@/components/AuthForm";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up" },
      { name: "description", content: "Create youraccount and start generating AI powered campaign strategies." },
      { property: "og:title", content: "Sign up" },
      { property: "og:description", content: "Create your account for agentic AI marketing." },
    ],
  }),
  component: SignUpPage,
});

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email format")
    .matches(/@gmail\.com$/, "Must be a valid Gmail email")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(/[^a-zA-Z0-9]/, "Password must contain at least one special character")
    .required("Password is required"),
});

function SignUpPage() {
  const navigate = useNavigate();

  return (
    <AuthForm
      kind="signup"
      validationSchema={validationSchema}
      passwordPlaceholder="At least 8 characters"
      onSubmit={() => {
        navigate({ to: "/login" });
      }}
    />
  );
}
