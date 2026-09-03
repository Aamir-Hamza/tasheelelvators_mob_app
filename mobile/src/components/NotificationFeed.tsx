import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNotifications } from '../context/NotificationsContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { formatWhen } from '../utils/format';

export function NotificationFeed() {
  const { items, unread, markRead, markAllRead } = useNotifications();
  const { t } = useI18n();
  const { theme } = useTheme();
  const latest = items.slice(0, 5);

  if (latest.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t('notifications')}
          {unread ? ` · ${unread}` : ''}
        </Text>
        {unread ? (
          <Pressable onPress={markAllRead}>
            <Text style={{ color: theme.accent, fontWeight: '700' }}>{t('markAllRead')}</Text>
          </Pressable>
        ) : null}
      </View>
      {latest.map((n) => (
        <Pressable
          key={n._id}
          onPress={() => {
            if (!n.read) markRead(n._id);
          }}
          style={[styles.row, { borderColor: theme.border, backgroundColor: n.read ? 'transparent' : `${theme.accent}14` }]}
        >
          <Text style={{ color: n.kind === 'emergency' ? theme.alert : theme.text, fontWeight: '800' }}>{n.title}</Text>
          <Text style={{ color: theme.muted, marginTop: 2 }}>{n.body}</Text>
          <Text style={{ color: theme.muted, marginTop: 4, fontSize: 11 }}>{formatWhen(n.createdAt)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontWeight: '800', fontSize: 16 },
  row: { borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 8 },
});
