import { IsCompleteRequest, IsCompleteResponse } from "aws-cdk-lib/custom-resources/lib/provider-framework/types";
import { Organizations } from "aws-sdk";
const organizationsClient = new Organizations({ region: "us-east-1" });

/**
 * The isComplete handler is repeatedly invoked checking CreateAccountStatus until SUCCEEDED or FAILED.
 * @see https://docs.aws.amazon.com/cdk/api/v1/docs/custom-resources-readme.html#asynchronous-providers-iscomplete
 */
export async function handler(event: IsCompleteRequest): Promise<IsCompleteResponse> {
  console.log(`Request of type ${event.RequestType} received`);

  if (!event.PhysicalResourceId) {
    throw new Error("Missing PhysicalResourceId parameter.");
  }

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Organizations.html#describeCreateAccountStatus-property
  const response: Organizations.DescribeCreateAccountStatusResponse = await organizationsClient
    .describeCreateAccountStatus({ CreateAccountRequestId: event.PhysicalResourceId })
    .promise();

  const { State, AccountId, AccountName, FailureReason } = response.CreateAccountStatus || {};

  if (State == "FAILED") {
    throw new Error(
      `Failed ${event.RequestType} Account ${AccountName} with Id ${AccountId}, reason: ${FailureReason}`
    );
  }

  return { IsComplete: State === "SUCCEEDED", Data: { AccountId: AccountId, AccountName: AccountName } };
}