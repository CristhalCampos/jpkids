'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import ScheduleSection from '@/components/dashboard/ScheduleSection';
import SavingSection from '@/components/dashboard/SavingSection';
import PresenceSection from '@/components/dashboard/PresenceSection';
import StarsSection from '@/components/dashboard/StarsSection';
import UpcomingEventsSection from '@/components/dashboard/UpcomingEventsSection';
import MonthlyBirthdaysSection from '@/components/dashboard/MonthlyBirthdaysSection';

interface ScheduleItem {
  id: string | number;
  date: string;
  day: string;
  group_id?: number | string;
}

interface NoticeItem {
  type: string;
  title: string;
  date: string;
  start_time: string;
}

interface BirthdayItem {
  name: string;
  image?: string;
}

interface PresenceItem {
  name: string;
  percentage: number;
}

interface StarItem {
  name: string;
  image?: string;
  stars: number;
}

interface SavingsData {
  reason?: string;
  current_amount?: number;
  target_amount?: number;
  is_completed?: boolean;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [weeklySchedule, setWeeklySchedule] = useState<ScheduleItem[]>([]);
  const [upcomingNotices, setUpcomingNotices] = useState<NoticeItem[]>([]);
  const [monthlyBirthdays, setMonthlyBirthdays] = useState<BirthdayItem[]>([]);
  const [bestPresence, setBestPresence] = useState<PresenceItem[]>([]);
  const [classesTaughtCount, setClassesTaughtCount] = useState(0);
  const [topStars, setTopStars] = useState<StarItem[]>([]);
  const [savingsData, setSavingsData] = useState<SavingsData | null>(null);
  const [teacherGroups, setTeacherGroups] = useState<number[]>([]);

  // Instanciamos el cliente de Supabase para componentes del lado cliente ('use client')
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const today = new Date().toISOString().split('T')[0];

        const todayObj = new Date();
        todayObj.setDate(todayObj.getDate() - 7);
        const pastDate = todayObj.toISOString().split('T')[0];

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: groupTeacherData } = await supabase
            .from('group_teacher')
            .select('group_id')
            .eq('teacher_id', user.id);

          if (groupTeacherData && groupTeacherData.length > 0) {
            const groupIds = groupTeacherData.map((item: any) => item.group_id);
            setTeacherGroups(groupIds);
          }
        }

        const { data: scheduleData } = await supabase
          .from('schedule_day')
          .select('id, date, day, group_id')
          .gte('date', pastDate)
          .order('date', { ascending: true })
          .limit(30);

        setWeeklySchedule(scheduleData || []);

        const { data: eventData } = await supabase
          .from('event')
          .select('title, date, start_time')
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(3);

        const formattedEvents = (eventData || []).map((ev: any) => ({
          type: "Evento",
          title: ev.title,
          date: ev.date,
          start_time: ev.start_time
        }));
        setUpcomingNotices(formattedEvents);

        const currentMonth = new Date().getMonth() + 1;
        const { data: kidsData } = await supabase
          .from('kids')
          .select('first_name, last_name, photo_url, birthday');

        const filteredBirthdays = (kidsData || []).filter((kid: any) => {
          if (!kid.birthday) return false;
          const bMonth = new Date(kid.birthday).getMonth() + 1;
          return bMonth === currentMonth;
        }).map((kid: any) => ({
          name: `${kid.first_name} ${kid.last_name || ''}`.trim(),
          image: kid.photo_url
        }));
        setMonthlyBirthdays(filteredBirthdays);

        const { data: presenceData } = await supabase
          .from('presence')
          .select('is_present, kid_id, schedule_day(id, date)')
          .eq('is_present', true);

        const { data: allKids } = await supabase.from('kids').select('id, first_name, last_name, photo_url');

        const { count: classesCount } = await supabase
          .from('schedule_day')
          .select('*', { count: 'exact', head: true })
          .lte('date', today);

        setClassesTaughtCount(classesCount || 0);

        const presenceMap: Record<string | number, number> = {};
        (presenceData || []).forEach((p: any) => {
          if (!presenceMap[p.kid_id]) {
            presenceMap[p.kid_id] = 0;
          }
          presenceMap[p.kid_id] += 1;
        });

        const kidsWithAttendance = (allKids || []).map((kid: any) => {
          const presentCount = presenceMap[kid.id] || 0;
          const percentage = classesCount && classesCount > 0 ? Math.round((presentCount / classesCount) * 100) : 0;
          
          return {
            name: `${kid.first_name} ${kid.last_name || ''}`.trim(),
            percentage,
            presentCount
          };
        });

        const kidsPresenceRanked = kidsWithAttendance
          .filter((kid) => kid.presentCount > 0)
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 2)
          .map(({ name, percentage }) => ({ name, percentage }));

        setBestPresence(kidsPresenceRanked);

        const { data: starsData } = await supabase
          .from('kid_stars')
          .select('kid_id, points, kids(first_name, last_name, photo_url)');

        const starsMap: Record<string | number, StarItem> = {};
        (starsData || []).forEach((item: any) => {
          if (!item.kids) return;
          const kId = item.kid_id;
          if (!starsMap[kId]) {
            starsMap[kId] = {
              name: `${item.kids.first_name} ${item.kids.last_name || ''}`.trim(),
              image: item.kids.photo_url,
              stars: 0
            };
          }
          starsMap[kId].stars += (item.points || 1);
        });

        const sortedStars = Object.values(starsMap)
          .sort((a, b) => b.stars - a.stars)
          .slice(0, 3);

        setTopStars(sortedStars);

        const { data: savingData } = await supabase
          .from('saving')
          .select('*')
          .eq('is_completed', false)
          .limit(1)
          .maybeSingle();

        setSavingsData(savingData);

      } catch (error) {
        console.error("Error cargando datos del dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <ScheduleSection
        weeklySchedule={weeklySchedule}
        teacherGroups={teacherGroups}
      />

      <SavingSection savingsData={savingsData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingEventsSection upcomingNotices={upcomingNotices} />
        <MonthlyBirthdaysSection monthlyBirthdays={monthlyBirthdays} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PresenceSection
          bestPresence={bestPresence}
          classesTaughtCount={classesTaughtCount}
        />
        <StarsSection topStars={topStars} />
      </div>
    </div>
  );
}