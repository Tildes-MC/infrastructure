import Head from "next/head";
import { useRouter } from "next/router";

import { CheckCircleIcon } from "@/icons/CheckCircleIcon";

export default function Success() {
  const router = useRouter();
  const username = [router.query["username"]].flat()[0];

  return (
    <>
      <Head>
        <title>Verification Complete</title>
      </Head>

      <div className="p-4 border border-gray-300 bg-white rounded-lg shadow-md max-w-md w-full text-center">
        <div className="mt-2 mb-2 text-green-500">
          <CheckCircleIcon className="h-16 w-16 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Verification Complete
        </h2>
        <p className="text-gray-700 mb-2">
          Your nickname has been set to{" "}
          <span className="font-semibold text-blue-500">
            {username || "unknown"}
          </span>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          You can now remove the validation string from your bio.
        </p>
      </div>
    </>
  );
}
