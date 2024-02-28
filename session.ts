import { LookerNodeSDK } from '@looker/sdk-node'
async () => {
  // create a Node SDK object for API 4.0
  const sdk = LookerNodeSDK.init40()
  // retrieve your user account to verify correct credentials
  const me = await sdk.ok(sdk.me(
    "id, first_name, last_name, display_name, email, personal_space_id, home_space_id, group_ids, role_ids"))
  console.log({me})}