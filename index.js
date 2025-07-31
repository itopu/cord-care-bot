const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once('ready', async () => {
    console.log(`✅ Bot is online as ${client.user.tag}`);

    try {
        await client.user.setUsername('Cord Care'); // ⬅️ এখানে আপনি নতুন নাম দিন
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

client.login(process.env.TOKEN);

// 👇 Add at the bottom of index.js
const http = require('http');

http.createServer((req, res) => {
  res.write('Cord Care Bot is alive!');
  res.end();
}).listen(process.env.PORT || 3000);
