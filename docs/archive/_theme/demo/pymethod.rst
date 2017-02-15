==============
Python Methods
==============

.. contents:: Table of Contents
   :depth: 2

.. py:function:: send_message(sender, recipient, message_body, [priority=1])

   Send a message to a recipient

   :param str sender: The person sending the message
   :param str recipient: The recipient of the message
   :param str message_body: The body of the message
   :param priority: The priority of the message, can be a number 1-5
   :type priority: integer or None
   :return: the message id
   :rtype: int
   :raises ValueError: if the message_body exceeds 160 characters
   :raises TypeError: if the message_body is not a basestring


Client
------

.. py:class:: Foo.Client

  Lorem ipsum dolor. Lorem ipsum dolor::

    client = foo.create_client('baz')

  Available methods:

  * :py:meth:`bar`

.. py:method:: bar(**kwargs)

  Lorem ipsum dolor. Lorem ipsum dolor.

  **Request Syntax**

  ::

      response = client.accept_vpc_peering_connection(
          DryRun=True|False,
          VpcPeeringConnectionId='string'
      )

  :type DryRun: boolean
  :param DryRun:

      Checks whether you have the required permissions for the action, without
      actually making the request, and provides an error response. If you have
      the required permissions, the error response is ``DryRunOperation``.
      Otherwise, it is ``UnauthorizedOperation``.

  :type VpcPeeringConnectionId: string
  :param VpcPeeringConnectionId:

    The ID of the VPC peering connection.

  :rtype: dict
  :returns:

      **Response Syntax**

      ::

          {
              'VpcPeeringConnection': {
                  'AccepterVpcInfo': {
                      'CidrBlock': 'string',
                      'OwnerId': 'string',
                      'VpcId': 'string'
                  },
                  'ExpirationTime': datetime(2015, 1, 1),
                  'RequesterVpcInfo': {
                      'CidrBlock': 'string',
                      'OwnerId': 'string',
                      'VpcId': 'string'
                  },
                  'Status': {
                      'Code': 'string',
                      'Message': 'string'
                  },
                  'Tags': [
                      {
                          'Key': 'string',
                          'Value': 'string'
                      },
                  ],
                  'VpcPeeringConnectionId': 'string'
              }
          }

      **Response Structure**

      - *(dict) --*

        - **VpcPeeringConnection** *(dict) --* Information about the VPC peering connection.

          - **AccepterVpcInfo** *(dict) --* The information of the peer VPC.

            - **CidrBlock** *(string) --* The CIDR block for the VPC.

              - **OwnerId** *(string) --* The AWS account ID of the VPC owner.
              - **VpcId** *(string) --* The ID of the VPC.
              - **ExpirationTime** *(datetime) --* The time that an unaccepted VPC peering connection will expire.
              - **RequesterVpcInfo** *(dict) --* The information of the requester VPC.

                - **CidrBlock** *(string) --* The CIDR block for the VPC.
                - **OwnerId** *(string) --* The AWS account ID of the VPC owner.
                - **VpcId** *(string) --* The ID of the VPC.
                - **Status** *(dict) --* The status of the VPC peering connection.
                - **Code** *(string) --* The status of the VPC peering connection.
                - **Message** *(string) --* A message that provides more information about the status, if applicable.
                - **Tags** *(list) --* Any tags assigned to the resource.

                  - *(dict) --* Describes a tag.

                    - **Key** *(string) --* The key of the tag.

                        Constraints: Tag keys are case-sensitive and accept a maximum of 127 Unicode characters. May not begin with ``aws:``

                    - **Value** *(string) --* The value of the tag.

                        Constraints: Tag values are case-sensitive and accept a maximum of 255 Unicode characters.

                    - **VpcPeeringConnectionId** *(string) --* The ID of the VPC peering connection.
