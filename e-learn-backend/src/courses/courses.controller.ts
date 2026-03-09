import { Controller, Get, Post, Body, Param, Put, Patch, Delete, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, CreateSectionDto, CreateLessonDto } from './dto/course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) { }

    // ── Course ────────────────────────────────────────────────────────────────

    @Get()
    async findAll() {
        return this.coursesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.coursesService.findOne(id);
    }

    @Get(':id/contact')
    async getContactNumber(@Param('id') id: string) {
        const course = await this.coursesService.findOne(id);
        return { contact_number: course.contact_number };
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Post()
    async createCourse(@Body() data: CreateCourseDto) {
        return this.coursesService.createCourse(data);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Put(':id')
    async updateCourse(@Param('id') id: string, @Body() data: Partial<CreateCourseDto>) {
        return this.coursesService.updateCourse(id, data);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Delete(':id')
    async deleteCourse(@Param('id') id: string) {
        return this.coursesService.deleteCourse(id);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Put(':id/toggle-active')
    async toggleActive(@Param('id') id: string) {
        return this.coursesService.toggleActive(id);
    }

    // ── Section ───────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Post(':courseId/sections')
    async addSection(@Param('courseId') courseId: string, @Body() data: CreateSectionDto) {
        return this.coursesService.addSection(courseId, data);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Put('sections/:sectionId')
    async updateSection(@Param('sectionId') sectionId: string, @Body() data: Record<string, any>) {
        return this.coursesService.updateSection(sectionId, data);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Delete('sections/:sectionId')
    async deleteSection(@Param('sectionId') sectionId: string) {
        return this.coursesService.deleteSection(sectionId);
    }

    // ── Lesson ────────────────────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Post(':courseId/sections/:sectionId/lessons')
    async addLesson(
        @Param('courseId') courseId: string,
        @Param('sectionId') sectionId: string,
        @Body() data: CreateLessonDto
    ) {
        return this.coursesService.addLesson(sectionId, data);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Put('lessons/:lessonId')
    async updateLesson(@Param('lessonId') lessonId: string, @Body() data: Partial<CreateLessonDto>) {
        return this.coursesService.updateLesson(lessonId, data);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Delete('lessons/:lessonId')
    async deleteLesson(@Param('lessonId') lessonId: string) {
        return this.coursesService.deleteLesson(lessonId);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Put('sections/:sectionId/reorder-lessons')
    async reorderLessons(
        @Param('sectionId') sectionId: string,
        @Body('lessonIds') lessonIds: string[]
    ) {
        return this.coursesService.reorderLessons(sectionId, lessonIds);
    }
}
