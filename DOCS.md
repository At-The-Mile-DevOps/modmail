# At The Mile ModMail - User Guide

# General Functionality

## Interacting with the Bot
The default prefix as assigned by the team is `m!`. This allows you to use all textual commands (there are little, if any, interaction based commands.)

## Starting a Ticket
Tickets are instantiated in one of two ways:
1. A user **messages the ModMail bot.**
2. A staff member **uses the m!contact command**.

Regardless of how a ticket is opened, the ticket is created in the _Pending_ category. **A ticket in the pending category should NOT be handled fully in that category!** This is because all users who are support representatives can see this category.

If you require more information about a user's request, that is okay, but once you have ascertained where a ticket should be transferred to, you must transfer the ticket - more on that below.

## Speaking in the Ticket
By default, messages that are not replies using the bot are **not** tracked on the user transcript, but **are** tracked on the staff transcript. This means you can freely converse in the channel with other support representatives, but must use the bot when you are ready to reply.

There are two different reply commands, with a third (Snippets) discussed below:
1. Use the **m!reply** (or **m!r**) command followed by your message to reply to the user. This message contains your display name (nickname), as well as your profile picture and your highest staff role in the footer text. This is the default means for replying to messages.
2. Use the **m!anonreply** (or **m!ar**) command. This does all of the above, without sharing any information about who you are. **This command is restricted to HR and above.**

You can only edit the most recent reply in a thread - to do so, do **m!edit** followed by your new message. User messages, if edited, will be shown with their old and new content. Additionally, user attachments will be attached in a new embed (if images) or as file links (if non-images). **Take particular care when clicking unknown links!**

## Transferring a Ticket
As mentioned, tickets must be transferred before the inquiry can be completed; this ensures privacy to the required team, as well as ensuring that staff members from appropriate departments handle all inquiries.

Firstly, find the category you want to transfer to if you don't know it. This can be done in the #modmail-cmds channel by running **m!categories.** **If a ticket does not fall into a category listed, please add a note for who is required to handle the ticket, and send the ticket to Human Resources.**

Once you have located your target category, run **m!transfer \<category\>** in the ticket, and the ticket will be automatically moved. If you no longer have permissions to view, the channel may appear to stall out - **this is fine.**

**Before moving a ticket, we encourage you to send a summary of the messages thus far to aid the new team.** Please do not ping the team - the bot will take care of this.

Should you notice the wrong team assigned to a ticket, please transfer them again as normal. Please try to avoid these situations as they can be disruptive to the user.

## Using Snippets
Snippets are a ModMail technology used in many bots, to allow the easy communication of **canned messages** (messages that are often repeated). To use a snippet, simply run **m!\<snippet name\>** in the ticket. If the command has an argument, such as a Reason parameter (see below), you should provide that after the command name.

## Adding New Users to a Thread
Users who are not normally permitted to see a thread can be added by a member of the team in question. Note the following default access permissions are as follows:

- **Leadership/HRM/HR** - all tickets.
- **Assistant / Divisions Manager** - ADM+ and DS tickets.
- **Events / Events Manager** - Events tickets.

If you require another user in the ticket, run **m!add \<user id\>** to add them. To remove the user, run **m!remove \<user id\>** - this only works on tickets where the user did not have access by default.

## Closing a Ticket
To close a ticket, you have two options:
1. **m!close \<reason\>** - a reason is not required (defaults to "Ticket Closed.") but is encouraged. This closes the ticket **immediately.**
2. **m!close \<time\> \<reason\>** - this closes the ticket **at the scheduled duration's end.**

If you are going to use the second option for a scheduled close, please use **ONE** of the following options:

- m - Minutes (1m to 60m)
- h - Hours (1h to 24h)
- d - Days (1d to 3d)

A scheduled close will cancel if you run **m!close cancel**, if the user sends another message, or you send another message back.

## Transcripts
Transcripts for a ticket will be placed in a transcript category in your department specific category as a text file. A transcript with any ModMail replies/transfers/closures will be sent to the user as well.

# Staff-Specific Functionality

## Creating, Editing, and Deleting Snippets - HRM+
_If you are not HRM+ and would like a snippet, please use the #snippet-request channel._

Snippets may contain any ordinary plain text, **no images or files**, and may contain 3 types of optional parameters:
1. **{u}** - when used in a snippet (e.g. Hello {u}), this replaces this text with the ping of the user you are messaging.
2. **{a}** - when used in a snippet, this replaces this text with your ping.
3. **{r}** - when used in a snippet, this replaces this text with a reason that users must provide after the snippet (e.g. m!strike Failure to meet Division Quota).

To create a snippet, use **m!snippets new \<name\> \<snippet text\>**, where the name is the identifier you want for the snippet (if you want to use multiple words, please hyphenate them: m!snippets new hello-there).

To edit a snippet, use **m!snippets edit \<name\> \<new text\>**. To delete a snippet, use **m!snippets delete \<name\>**.

## Creating, Editing, and Deleting Categories - Jr. Dev+
At the time of the current version of this ModMail system, we do not support the creating, editing or deleting of categories due to a lack of demand. However, if you'd like to change a listed category, please see a member of the Development Team.

## Warning a User for Abuse - HR+
If a user is abusing the ModMail system, ping a member of Human Resources, and they will be able to administer a warning for the user.

To administer a warning, use **m!warn \<reason\>** inside the ticket. These warnings will be shown on any new tickets the user creates.

3 warnings will implement a 7-day ban from incoming ModMail messages; 4 warnings will implement a 14-day ban, and 5 warnings will permanently ban the user subject to HRM+ review.

Warnings can be revoked by contacting a member of the Development Team.

Instant blacklists can be invoked by a member of HRM+ using the **m!blacklist \<reason\>** command. This immediately invokes the equivalent of 5 warnings, and bans the user immediately.

If a user ban is triggered, their ticket will automatically close.

# Issues, Feedback, and Concerns
If ModMail is available, please message ModMail and your ticket will be routed to the Development category. If the bot is offline, please mention a member of the Development Team in #team-chat (primary contact: Tyler).

# NDA Statement
Please remember that all ModMail activities, including these documents, any interactions through the bot, and transcripts, are all covered under the staff NDA.

