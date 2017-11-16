# aws_iot_mailbox
Repository for using an IOT mailbox (technically a shadow of physical mailbox) and checking/managing mail status. It has 2 main components
- A Mailbox IOT device that acts as a shadow for a physical mailbox. For the purpose of this project, it is a virtual IOT device.
- An Alexa Skill to check whether there are any mails and to reset the state of the mailbox.

The Mailbox state management logic is relatively straight-forward for the purpose of illustration. A more complex logic can be built using multiple sensors,
such as, a photo sensor in combination with the open/close sensor.
- The Mailbox manager lambda has a simple intelligence to set the mailbox state to having mail if it is opened within the delivery schedule.
- If opened more than once within the delivery schedule or post delivery schedule, the mailbox state is reset (i.e., mail has been cleared). 

## Setup

### Pre-requisites
- Register for an [AWS Account](https://aws.amazon.com/)
- Register for an [Amazon Developer Account](https://developer.amazon.com/)
- Install and set up [AWS CLI](http://docs.aws.amazon.com/lambda/latest/dg/setup-awscli.html)
- Install and set up [ASK CLI](https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html)


### Setup Instructions
1. Mailbox IOT Device Setup

1.1 Create an IOT Role
```
aws iam create-role --role-name iot-role --assume-role-policy-document file://iot_role_trust.json
```

1.2 Create an IOT Policy and attach Role
```
aws iam create-policy --policy-name "Mailbox-Policy" --policy-document file://mailbox_policy.json
aws iam attach-role-policy --role-name iot-role --policy-arn "arn:aws:iam::281672010130:policy/Mailbox-Policy"
```

1.3 Create a Thing Type
```
aws iot create-thing-type --thing-type-name "Mailbox" --thing-type-properties "thingTypeDescription=Mailbox, searchableAttributes=isOpen,hasMail"
```

1.4 Create a Mailbox Thing
```
aws iot create-thing --thing-name "MyMailbox" --thing-type-name "Mailbox" --attribute-payload "{\"attributes\": {\"isOpen\": \"false\", \"hasMail\": \"false\"}}"
```

1.5 Create the MailboxManager lambda

- Edit the ```mailbox_manager.cfn``` and replace the following.
  - **IOT_BROKER_ENDPOINT**: Update this to point to the REST API endpoint of your thing from **Device Details->Interact**.
  - **IOT_BROKER_REGION**: Update this for your device region.
  - **IOT_THING_NAME**: The mailbox IOT device name (if different from "MyMailbox").
- Use the ```mailbox_manager.cfn``` to create the lambda that manages the updates to the Mailbox IOT device.
- After the lambda is created, add a trigger from "Alexa Skills Kit". 

1.6 Create a Rule to update Mailbox

- Specify the query to fetch data from an IOT topic.
  ```
  SELECT isOpen FROM 'mail' WHERE isOpen <> ''
  ```
  __Note__: The name of the topic is 'mail'.
- Specify an action to associate the above lambda (```MailboxManager```) when this rule is triggered.


2. Mailbox Alexa Skill Setup

- Run the following command to create a new Mailbox skill in your developer account.
  ```
  ask new
  ```
- Update the ```alexa/lambda/custom/index.js``` for the following.
  - **APP_ID**: Update this to use the App ID created above.
  - **IOT_BROKER_ENDPOINT**: Update this to point to the REST API endpoint of your thing from **Device Details->Interact**.
  - **IOT_BROKER_REGION**: Update this for your device region.
  - **IOT_THING_NAME**: The mailbox IOT device name (if different from "MyMailbox").
- Run the following command to set up the Mailbox Alexa Skill.
  ```
  cd alexa
  ask deploy
  ```
- Once the skill has been deployed, enable the "Test" button to start testing the skill.


3. Testing

- Use the AWS IoT Console to publish a message to the 'mail' topic. Use the payload below for reference and manipulate the value for "isOpen".
  ```
  {
    "isOpen": "false"
  }
  ```
- Go to the above Mailbox skill->Testing and try the following utterances.
  ```
  check mail
  reset
  ```

4. Troubleshooting

Check out the following CloudWatch log groups.

- MailboxManager: For troubleshooting the Mailbox IOT device events.
- Mailbox: For the Alexa Skill processing troubleshooting.