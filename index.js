const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once('ready', async () => {
    console.log(`✅ Bot is online as ${client.user.tag}`);

    try {
        await client.user.setUsername('Support'); // ⬅️ এখানে আপনি নতুন নাম দিন
        console.log('📝 Username updated via API.');
    } catch (error) {
        console.error('❌ Failed to update bot username:', error);
    }
});

client.on('guildMemberAdd', async (member) => {
    const guild = member.guild;
    const adminRole = guild.roles.cache.find(role => role.name === process.env.ADMIN_ROLE_NAME);

    if (!adminRole) {
        console.error('❌ Admin role not found!');
        return;
    }

    const permissionOverwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
            id: member.id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.Speak,
                PermissionsBitField.Flags.Connect,
                PermissionsBitField.Flags.UseVAD
            ],
            deny: [
                PermissionsBitField.Flags.CreateInstantInvite,
                PermissionsBitField.Flags.MentionEveryone,
                PermissionsBitField.Flags.UseExternalEmojis,
                PermissionsBitField.Flags.UseExternalStickers,
                PermissionsBitField.Flags.UseEmbeddedActivities,
                PermissionsBitField.Flags.UseApplicationCommands,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.SendTTSMessages,
                PermissionsBitField.Flags.Stream
            ]
        },
        {
            id: adminRole.id,
            allow: [PermissionsBitField.Flags.Administrator]
        }
    ];

    try {
        console.log(`📁 Creating category for ${member.user.username}`);

        const category = await guild.channels.create({
            name: member.user.username,
            type: ChannelType.GuildCategory,
            permissionOverwrites
        });

        console.log(`✅ Category created: ${category.name}`);

        // ✅ Create Announcement Channel
        const announcementTextChannel = await guild.channels.create({
            name: 'announcement',
            type: ChannelType.GuildText,
            parent: category,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: member.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ],
                    deny: [
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.AddReactions,
                        PermissionsBitField.Flags.MentionEveryone,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.EmbedLinks
                    ]
                },
                {
                    id: adminRole.id,
                    allow: [PermissionsBitField.Flags.Administrator]
                }
            ]
        });

        console.log(`✅ Announcement channel created`);

        // ✅ Create Text Channel
        const textChannel = await guild.channels.create({
            name: 'text',
            type: ChannelType.GuildText,
            parent: category,
            permissionOverwrites
        });

        // ✅ Welcome message in private text channel
        await textChannel.send(`👋 Welcome to Retailstub, ${member.user.username}!`);

        // ✅ Create Voice Channel
        await guild.channels.create({
            name: 'Meeting',
            type: ChannelType.GuildVoice,
            parent: category,
            permissionOverwrites
        });

        console.log(`✅ Private channels created for ${member.user.username}`);

        // Optional Log
        const logChannel = guild.channels.cache.get(process.env.BOT_LOG_ID);
        if (logChannel && logChannel.isTextBased()) {
            logChannel.send(`👋 ${member.user.tag} joined. Private space created.`);
        }

    } catch (err) {
        console.error('❌ Error during channel creation:', err);
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== process.env.MAIN_ANNOUNCEMENT_CHANNEL_ID) return;

    const guild = message.guild;
    if (!guild) return;

    // Extended check for actual content
    const hasContent = message.content?.trim().length > 0;
    const hasEmbeds = message.embeds?.length > 0;
    const hasAttachments = message.attachments?.size > 0;
    const hasStickers = message.stickers?.size > 0;
    const hasComponents = message.components?.length > 0;

    if (!hasContent && !hasEmbeds && !hasAttachments && !hasStickers && !hasComponents) {
        console.log('❌ Skipping empty message (no content/embed/attachment/sticker/component)');
        return;
    }

    console.log(`📨 Forwarding: ${message.content || '[non-text]'}`);

    const members = await guild.members.fetch();

    for (const [, member] of members) {
        if (member.user.bot) continue;

        const category = guild.channels.cache.find(
            ch => ch.type === ChannelType.GuildCategory && ch.name === member.user.username
        );
        if (!category) continue;

        const announcementChannel = guild.channels.cache.find(
            ch =>
                ch.parentId === category.id &&
                ch.name === 'announcement' &&
                ch.type === ChannelType.GuildText
        );
        if (!announcementChannel) continue;

        try {
            await announcementChannel.send({
                content: hasContent ? `${message.content}` : undefined,
                embeds: hasEmbeds ? message.embeds : undefined,
                files: hasAttachments ? [...message.attachments.values()] : undefined,
                stickers: hasStickers ? [...message.stickers.values()] : undefined,
                components: hasComponents ? message.components : undefined
            });
            console.log(`✅ Sent to ${member.user.username}`);
        } catch (err) {
            console.error(`❌ Failed to send to ${member.user.username}:`, err.message);
        }
    }
});



client.login(process.env.TOKEN);

// 👇 Add at the bottom of index.js
const http = require('http');

http.createServer((req, res) => {
    res.write('Cord Care Bot is alive!');
    res.end();
}).listen(process.env.PORT || 3000);
