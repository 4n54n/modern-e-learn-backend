export class CreateCourseDto {
    title!: string;
    description!: string;
    thumbnail_url!: string;
    intro_video_url?: string | null;
    price!: number;
    original_price?: number | null;
    validity_days?: number | null;
    contact_number?: string;
    is_active?: boolean;
}

export class CreateSectionDto {
    title!: string;
    order_index!: number;
    is_free?: boolean;
}

export class CreateLessonDto {
    title!: string;
    description?: string;
    video_url?: string;
    document_url?: string;
    order_index!: number;
}
