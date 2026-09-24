import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as Yup from "yup";
import AuthForm from "@/components/AuthForm";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in" },
      { name: "description", content: "Log in to access your marketing analytics, AI assistant and campaign strategies." },
      { property: "og:title", content: "Log in" },
      { property: "og:description", content: "Access your marketing command center." },
    ],
  }),
  component: LoginPage,
});

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email format")
    .matches(/@gmail\.com$/, "Must be a valid Gmail email")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

function LoginPage() {
  const navigate = useNavigate();

  return (
    <AuthForm
      kind="login"
      validationSchema={validationSchema}
      passwordPlaceholder="Your password"
      onSubmit={() => {
        navigate({ to: "/setup" });
      }}
    />
  );
}
