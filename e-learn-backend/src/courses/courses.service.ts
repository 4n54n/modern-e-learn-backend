import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, CreateSectionDto, CreateLessonDto } from './dto/course.dto';

@Injectable()
export class CoursesService {
    constructor(private prisma: PrismaService) { }

    // ── Course ────────────────────────────────────────────────────────────────

    async createCourse(data: CreateCourseDto) {
        return this.prisma.course.create({ data });
    }

    async findAll(activeOnly = false) {
        return this.prisma.course.findMany({
            where: activeOnly ? ({ is_active: true } as any) : undefined,
            include: {
                sections: {
                    orderBy: { order_index: 'asc' },
                    include: { lessons: { orderBy: { order_index: 'asc' } } }
                },
                _count: { select: { purchases: true } }
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async findOne(id: string) {
        const course = await this.prisma.course.findUnique({
            where: { id },
            include: {
                sections: {
                    orderBy: { order_index: 'asc' },
                    include: { lessons: { orderBy: { order_index: 'asc' } } }
                }
            }
        });
        if (!course) throw new NotFoundException('Course not found');
        return course;
    }

    async updateCourse(id: string, data: Partial<CreateCourseDto>) {
        return this.prisma.course.update({ where: { id }, data: data as any });
    }

    async deleteCourse(id: string) {
        return this.prisma.course.delete({ where: { id } });
    }

    async toggleActive(id: string) {
        const course = await this.prisma.course.findUnique({ where: { id } });
        if (!course) throw new NotFoundException('Course not found');
        return this.prisma.course.update({
            where: { id },
            data: { is_active: !course.is_active } as any,
        });
    }

    // ── Section ───────────────────────────────────────────────────────────────

    async addSection(courseId: string, data: CreateSectionDto) {
        return this.prisma.section.create({
            data: { ...data, course_id: courseId, is_free: data.is_free ?? false } as any,
            include: { lessons: true },
        });
    }

    async updateSection(sectionId: string, data: Record<string, any>) {
        return this.prisma.section.update({
            where: { id: sectionId },
            data: { ...data, is_free: data.is_free ?? undefined } as any,
            include: { lessons: { orderBy: { order_index: 'asc' } } },
        });
    }

    async deleteSection(sectionId: string) {
        return this.prisma.section.delete({ where: { id: sectionId } });
    }

    // ── Lesson ────────────────────────────────────────────────────────────────

    async addLesson(sectionId: string, data: CreateLessonDto) {
        return this.prisma.lesson.create({
            data: { ...data, section_id: sectionId }
        });
    }

    async updateLesson(lessonId: string, data: Partial<CreateLessonDto>) {
        return this.prisma.lesson.update({
            where: { id: lessonId },
            data,
        });
    }

    async deleteLesson(lessonId: string) {
        return this.prisma.lesson.delete({ where: { id: lessonId } });
    }

    async reorderLessons(sectionId: string, lessonIds: string[]) {
        // Update each lesson's order_index to match position in provided array
        await Promise.all(
            lessonIds.map((id, idx) =>
                this.prisma.lesson.update({
                    where: { id },
                    data: { order_index: idx + 1 } as any,
                })
            )
        );
        return { success: true };
    }
}
